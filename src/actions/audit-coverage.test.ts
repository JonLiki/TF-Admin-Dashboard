/**
 * Audit-coverage regression tests.
 *
 * Every admin-gated mutating action must leave an audit trail. `requireAdmin()`
 * controls WHO may write; `writeAuditLog()` records THAT they did. The two
 * security choke-points must stay aligned — a gated write with no audit entry
 * is an untraceable change to competition data (weigh-ins, attendance, scores).
 *
 * This locks in the data-entry + scoring actions that were previously gated but
 * unaudited. The structural CRUD/import actions are covered by their own suites.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

const { prismaMock, txMock } = vi.hoisted(() => {
    const txMock = {
        teamWeekMetric: { upsert: vi.fn(), update: vi.fn() },
        teamWeekAward: { deleteMany: vi.fn(), create: vi.fn() },
        pointLedger: { deleteMany: vi.fn(), create: vi.fn() },
        blockWeek: { update: vi.fn() }
    };
    const prismaMock = {
        weighIn: { upsert: vi.fn() },
        kmLog: { upsert: vi.fn() },
        lifestyleLog: { upsert: vi.fn() },
        benchmarkLog: { upsert: vi.fn() },
        attendance: { upsert: vi.fn() },
        blockWeek: { findUnique: vi.fn(), findMany: vi.fn() },
        session: { findUnique: vi.fn() },
        team: { findMany: vi.fn() },
        auditLog: { create: vi.fn() },
        $transaction: vi.fn()
    };
    return { prismaMock, txMock };
});
vi.mock('@/lib/prisma', () => ({ default: prismaMock }));

import { auth } from '@/auth';
import {
    submitWeighIn,
    submitWeighInsBulk,
    submitKmLog,
    submitKmLogsBulk,
    submitLifestyleLog,
    submitLifestyleLogsBulk,
    submitBenchmarkLog,
    submitBenchmarkLogsBulk,
    toggleAttendance
} from '@/actions/data';
import { calculateWeekResults } from '@/actions/scoring';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = vi.mocked(auth) as any;

const adminSession = { user: { id: 'u1', role: 'ADMIN' }, expires: '2099-01-01T00:00:00.000Z' };

const MEMBER_ID = '11111111-1111-4111-8111-111111111111';
const BLOCK_WEEK_ID = '22222222-2222-4222-8222-222222222222';
const SESSION_ID = '33333333-3333-4333-8333-333333333333';

const openWeek = {
    id: BLOCK_WEEK_ID,
    blockId: 'b1',
    weekNumber: 1, // valid for benchmark logging (week 1 or 8)
    startDate: new Date('2026-01-19T00:00:00.000Z'),
    endDate: new Date('2026-01-25T00:00:00.000Z'),
    isFinalized: false,
    block: { id: 'b1', weeks: [] }
};

const form = (entries: Record<string, string>) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(entries)) fd.append(k, v);
    return fd;
};

beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(adminSession);
    prismaMock.weighIn.upsert.mockResolvedValue({ id: 'wi1' });
    prismaMock.kmLog.upsert.mockResolvedValue({ id: 'km1' });
    prismaMock.lifestyleLog.upsert.mockResolvedValue({ id: 'ls1' });
    prismaMock.benchmarkLog.upsert.mockResolvedValue({ id: 'bm1' });
    prismaMock.attendance.upsert.mockResolvedValue({ id: 'att1' });
    prismaMock.blockWeek.findUnique.mockResolvedValue(openWeek);
    prismaMock.blockWeek.findMany.mockResolvedValue([]); // no finalized weeks
    prismaMock.session.findUnique.mockResolvedValue({ id: SESSION_ID, date: new Date('2026-01-20T00:00:00.000Z'), block: { weeks: [] } });
    prismaMock.team.findMany.mockResolvedValue([]);
    prismaMock.auditLog.create.mockResolvedValue({ id: 'a1' });
    prismaMock.$transaction.mockImplementation(async (arg: unknown) =>
        typeof arg === 'function' ? (arg as (tx: typeof txMock) => Promise<unknown>)(txMock) : Promise.resolve(arg)
    );
});

const expectAudit = (action: string) =>
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action }) })
    );

describe('gated data-entry actions write an audit entry on success', () => {
    it('submitWeighIn → LOG_WEIGH_IN', async () => {
        await submitWeighIn(undefined, form({ memberId: MEMBER_ID, weight: '80.5', date: '2026-01-20' }));
        expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
        expectAudit('LOG_WEIGH_IN');
    });

    it('submitWeighInsBulk → LOG_WEIGH_INS_BULK', async () => {
        await submitWeighInsBulk(undefined, form({ date: '2026-01-20', [`weight_${MEMBER_ID}`]: '80' }));
        expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
        expectAudit('LOG_WEIGH_INS_BULK');
    });

    it('submitKmLog → LOG_KM', async () => {
        await submitKmLog(undefined, form({ memberId: MEMBER_ID, blockWeekId: BLOCK_WEEK_ID, totalKm: '12' }));
        expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
        expectAudit('LOG_KM');
    });

    it('submitKmLogsBulk → LOG_KM_BULK', async () => {
        await submitKmLogsBulk(undefined, form({ blockWeekId: BLOCK_WEEK_ID, [`km_${MEMBER_ID}`]: '12' }));
        expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
        expectAudit('LOG_KM_BULK');
    });

    it('submitLifestyleLog → LOG_LIFESTYLE', async () => {
        await submitLifestyleLog(undefined, form({ memberId: MEMBER_ID, blockWeekId: BLOCK_WEEK_ID, postCount: '3' }));
        expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
        expectAudit('LOG_LIFESTYLE');
    });

    it('submitLifestyleLogsBulk → LOG_LIFESTYLE_BULK', async () => {
        await submitLifestyleLogsBulk(undefined, form({ blockWeekId: BLOCK_WEEK_ID, [`post_${MEMBER_ID}`]: '3' }));
        expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
        expectAudit('LOG_LIFESTYLE_BULK');
    });

    it('submitBenchmarkLog → LOG_BENCHMARK', async () => {
        await submitBenchmarkLog(undefined, form({ memberId: MEMBER_ID, blockWeekId: BLOCK_WEEK_ID, date: '2026-01-20', squats: '40', pushups: '30', burpees: '20' }));
        expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
        expectAudit('LOG_BENCHMARK');
    });

    it('submitBenchmarkLogsBulk → LOG_BENCHMARK_BULK', async () => {
        await submitBenchmarkLogsBulk(undefined, form({
            blockWeekId: BLOCK_WEEK_ID,
            date: '2026-01-20',
            [`squats_${MEMBER_ID}`]: '40',
            [`pushups_${MEMBER_ID}`]: '30',
            [`burpees_${MEMBER_ID}`]: '20'
        }));
        expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
        expectAudit('LOG_BENCHMARK_BULK');
    });

    it('toggleAttendance → TOGGLE_ATTENDANCE', async () => {
        await toggleAttendance(SESSION_ID, MEMBER_ID, true);
        expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
        expectAudit('TOGGLE_ATTENDANCE');
    });
});

describe('gated scoring action writes an audit entry on success', () => {
    it('calculateWeekResults (recalc) → CALCULATE_WEEK_RESULTS', async () => {
        await calculateWeekResults(BLOCK_WEEK_ID);
        expectAudit('CALCULATE_WEEK_RESULTS');
    });

    it('calculateWeekResults (lock) → FINALIZE_SCORES', async () => {
        await calculateWeekResults(BLOCK_WEEK_ID, { lockWeek: true });
        expectAudit('FINALIZE_SCORES');
    });
});

describe('weigh-ins are locked by finalized weeks', () => {
    // Monday 2026-01-26 weigh-in closes out week 1 (starts 2026-01-19), so it's in week 1's window.
    it.each([
        ['submitWeighIn', () => submitWeighIn(undefined, form({ memberId: MEMBER_ID, weight: '80.5', date: '2026-01-26' }))],
        ['submitWeighInsBulk', () => submitWeighInsBulk(undefined, form({ date: '2026-01-26', [`weight_${MEMBER_ID}`]: '80' }))],
    ])('%s refuses a date inside a finalized week window', async (_name, invoke) => {
        prismaMock.blockWeek.findMany.mockResolvedValue([{ startDate: openWeek.startDate }]);
        const result = await invoke();
        expect(result.success).toBe(false);
        expect(result.message).toMatch(/finalized/i);
        expect(prismaMock.weighIn.upsert).not.toHaveBeenCalled();
    });
});
