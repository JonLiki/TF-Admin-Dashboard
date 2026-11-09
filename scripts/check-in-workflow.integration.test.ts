import { describe, expect, it, vi } from 'vitest';
import { Prisma, PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '@next/env';

// Opt-in only. All fixture records and action writes share a real PostgreSQL
// transaction that is deliberately rolled back, including on assertion failure.
// Auth and Next cache APIs are the only application boundaries replaced here.
const context = vi.hoisted(() => ({ tx: null as Prisma.TransactionClient | null }));
vi.mock('@/lib/prisma', () => ({ default: new Proxy({}, {
    get(_target, key) {
        if (!context.tx) throw new Error('Integration database accessed outside rollback transaction');
        if (key === '$transaction') return (operation: (tx: Prisma.TransactionClient) => Promise<unknown>) => operation(context.tx!);
        return Reflect.get(context.tx, key);
    },
}) }));
vi.mock('@/lib/auth-guard', () => ({ requireAdmin: async () => ({ success: true, session: { user: {} } }) }));
vi.mock('@/auth', () => ({ auth: async () => ({ user: {} }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

import { saveWeeklyCheckIn } from '@/actions/check-in';
import { calculateWeekResults } from '@/actions/scoring';
import { getCheckInSnapshot } from '@/lib/check-in-queries';

describe.skipIf(process.env.RUN_CHECK_IN_DB_TESTS !== '1')('check-in database workflow', () => {
    it('saves, reloads, scores and locks fixture entries, then rolls everything back', async () => {
        loadEnvConfig(process.cwd());
        const db = new PrismaClient();
        const rollback = new Error('EXPECTED_WORKFLOW_ROLLBACK');
        let fixtureId: string | undefined;
        const activeBefore = await db.block.findMany({ where: { isActive: true }, select: { id: true }, orderBy: { id: 'asc' } });
        try {
            await expect(db.$transaction(async tx => {
                context.tx = tx;
                const block = await tx.block.create({ data: {
                    name: 'CHECK-IN WORKFLOW TEST - ROLLED BACK', isActive: true,
                    startDate: new Date('2030-01-07T00:00:00Z'), endDate: new Date('2030-01-20T00:00:00Z'),
                } });
                fixtureId = block.id;
                const week = await tx.blockWeek.create({ data: { blockId: block.id, weekNumber: 1, startDate: block.startDate, endDate: new Date('2030-01-13T00:00:00Z') } });
                const next = await tx.blockWeek.create({ data: { blockId: block.id, weekNumber: 2, startDate: new Date('2030-01-14T00:00:00Z'), endDate: block.endDate } });
                const session = await tx.session.create({ data: { blockId: block.id, date: week.startDate, type: 'Monday' } });
                const team = await tx.team.create({ data: { name: 'CHECK-IN WORKFLOW TEST - ROLLED BACK' } });
                const members = await Promise.all(Array.from({ length: 4 }, (_, index) => tx.member.create({ data: {
                    firstName: 'Workflow', lastName: `Test ${index + 1}`, teamId: team.id,
                } })));
                type Cell = { memberId: string; columnId: string; value: string; previous: string | null };
                const cell = (columnId: string, value: string, previous: string | null = null): Cell => ({ memberId: members[0].id, columnId, value, previous });
                const save = (weekId: string, cells: Cell[]) => {
                    const form = new FormData(); form.set('payload', JSON.stringify({ weekId, cells }));
                    return saveWeeklyCheckIn(null, form);
                };
                const cells = members.flatMap((member, index) => [
                    ['weight-start', String(90 + index)], ['weight-end', String(89 + index)],
                    ['km', '12'], ['lifestyle', index ? '4' : '0'], [`attendance:${session.id}`, index ? 'present' : 'absent'],
                ].map(([columnId, value]) => ({ memberId: member.id, columnId, value, previous: null })));
                expect((await save(week.id, cells)).success).toBe(true);
                const snapshot = await getCheckInSnapshot(week.id, tx);
                expect(snapshot?.members.find(member => member.id === members[0].id)?.values).toMatchObject({
                    'weight-start': '90', 'weight-end': '89', km: '12', lifestyle: '0', [`attendance:${session.id}`]: 'absent',
                });
                expect(await tx.auditLog.count({ where: { entityId: week.id, action: 'SAVE_WEEKLY_CHECK_IN' } })).toBe(1);

                // An invalid later cell must prevent the earlier valid cell from writing.
                expect((await save(week.id, [cell('km', '99', '12'), cell('lifestyle', '1.5', '0')])).success).toBe(false);
                expect((await tx.kmLog.findUniqueOrThrow({ where: { memberId_blockWeekId: { memberId: members[0].id, blockWeekId: week.id } } })).totalKm).toBe(12);
                expect((await save(week.id, [cell('km', '99', '0')])).success).toBe(false);

                expect((await calculateWeekResults(week.id)).success).toBe(true);
                const metricKey = { teamId_blockWeekId: { teamId: team.id, blockWeekId: week.id } };
                expect(await tx.teamWeekMetric.findUniqueOrThrow({ where: metricKey })).toMatchObject({
                    kmAverage: 12, lifestyleAverage: 3, attendanceAverage: 0.75, weightLossTotal: 4, pointsAwarded: 4,
                });
                expect(await tx.teamWeekAward.count({ where: { blockWeekId: week.id, teamId: team.id } })).toBe(4);
                expect((await save(week.id, [cell('km', '24', '12')])).success).toBe(true);
                expect((await calculateWeekResults(week.id, { lockWeek: true })).success).toBe(true);
                expect(await tx.teamWeekMetric.findUniqueOrThrow({ where: metricKey })).toMatchObject({ kmAverage: 15, pointsAwarded: 4 });
                const ledger = await tx.pointLedger.aggregate({ where: { blockId: block.id, teamId: team.id }, _sum: { amount: true } });
                expect(ledger._sum.amount).toBe(4); // Recalculation must not duplicate points.
                expect((await save(week.id, [cell('km', '30', '24')])).success).toBe(false);
                const nextSnapshot = await getCheckInSnapshot(next.id, tx);
                expect(nextSnapshot?.columns.find(column => column.id === 'weight-start')?.locked).toBe(true);
                expect((await save(next.id, [cell('km', '5'), cell('weight-start', '88', '89')])).success).toBe(false);
                expect(await tx.kmLog.count({ where: { blockWeekId: next.id } })).toBe(0);
                expect((await save(next.id, [cell('km', '5')])).success).toBe(true);
                await tx.block.update({ where: { id: block.id }, data: { isActive: false } });
                expect((await save(next.id, [cell('km', '6', '5')])).success).toBe(false);
                throw rollback;
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60000 })).rejects.toBe(rollback);
            expect(fixtureId).toBeDefined();
            expect(await db.block.findUnique({ where: { id: fixtureId! } })).toBeNull();
            expect(await db.team.count({ where: { name: 'CHECK-IN WORKFLOW TEST - ROLLED BACK' } })).toBe(0);
            expect(await db.block.findMany({ where: { isActive: true }, select: { id: true }, orderBy: { id: 'asc' } })).toEqual(activeBefore);
        } finally {
            context.tx = null;
            await db.$disconnect();
        }
    }, 90000);
});
