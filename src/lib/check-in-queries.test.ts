import { beforeEach, describe, expect, it, vi } from 'vitest';
const { db } = vi.hoisted(() => ({ db: { blockWeek: { findUnique: vi.fn(), findMany: vi.fn() }, session: { findMany: vi.fn() }, member: { findMany: vi.fn() } } }));
vi.mock('@/lib/prisma', () => ({ default: db }));
import { getCheckInSnapshot } from './check-in-queries';

const week = { id: 'w', blockId: 'b', startDate: new Date('2026-02-02T00:00:00Z'), endDate: new Date('2026-02-08T00:00:00Z'), isFinalized: false, block: { isActive: true, name: 'Block' } };
beforeEach(() => {
    vi.resetAllMocks();
    db.blockWeek.findUnique.mockResolvedValue(week);
    db.blockWeek.findMany.mockResolvedValue([]);
    db.session.findMany.mockResolvedValue([{ id: 's1', date: week.startDate, type: 'Monday' }, { id: 's2', date: new Date('2026-02-04T00:00:00Z'), type: 'Wednesday' }]);
    db.member.findMany.mockResolvedValue([{ id: 'm', firstName: 'Member', lastName: 'One', teamId: null, team: null,
        weighIns: [{ date: week.startDate, weight: 90 }, { date: new Date('2026-02-09T00:00:00Z'), weight: 89 }],
        kmLogs: [{ totalKm: 0 }], lifestyleLogs: [], attendance: [{ sessionId: 's1', isPresent: false }] }]);
});
describe('weekly check-in snapshot', () => {
    it('keeps zero, absence and missing records distinct and includes the following Monday weight', async () => {
        const result = await getCheckInSnapshot('w');
        expect(result?.members[0].values).toEqual({ 'weight-start': '90', 'weight-end': '89', km: '0', lifestyle: null, 'attendance:s1': 'absent', 'attendance:s2': null });
    });
    it('queries only active members and selected-week sessions with a UTC-exclusive end boundary', async () => {
        await getCheckInSnapshot('w');
        expect(db.session.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { blockId: 'b', date: { gte: week.startDate, lt: new Date('2026-02-09T00:00:00Z') } } }));
        expect(db.member.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isActive: true }, include: expect.objectContaining({
            weighIns: { where: { date: { gte: week.startDate, lte: new Date('2026-02-09T00:00:00Z') } } },
            attendance: { where: { sessionId: { in: ['s1', 's2'] } } },
        }) }));
    });
    it('returns no snapshot if the week was deleted', async () => {
        db.blockWeek.findUnique.mockResolvedValue(null);
        expect(await getCheckInSnapshot('deleted')).toBeNull();
        expect(db.member.findMany).not.toHaveBeenCalled();
    });
});
