import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkInColumns, type CheckInMember } from '@/lib/check-in';

const { tx, db, snapshot, guard } = vi.hoisted(() => {
    const tx = { weighIn: { upsert: vi.fn() }, kmLog: { upsert: vi.fn() }, lifestyleLog: { upsert: vi.fn() }, attendance: { upsert: vi.fn() }, auditLog: { create: vi.fn() } };
    return { tx, db: { $transaction: vi.fn() }, snapshot: vi.fn(), guard: vi.fn() };
});
vi.mock('@/lib/prisma', () => ({ default: db }));
vi.mock('@/lib/check-in-queries', () => ({ getCheckInSnapshot: snapshot }));
vi.mock('@/lib/auth-guard', () => ({ requireAdmin: guard }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
import { revalidatePath } from 'next/cache';
import { saveWeeklyCheckIn } from './check-in';

const weekId = '22222222-2222-4222-8222-222222222222';
const memberId = '11111111-1111-4111-8111-111111111111';
const sessionId = '33333333-3333-4333-8333-333333333333';
const week = { id: weekId, blockId: 'b', weekNumber: 3, startDate: new Date('2026-02-02T00:00:00Z'), endDate: new Date('2026-02-08T00:00:00Z'), isFinalized: false, block: { isActive: true, name: 'Block' } };
const columns = () => checkInColumns(week, [{ id: sessionId, type: 'Monday', date: week.startDate }], []);
const member = (): CheckInMember => ({ id: memberId, name: 'Member One', teamId: 'team', teamName: 'Team', values: { 'weight-start': '90', 'weight-end': null, km: null, lifestyle: null, [`attendance:${sessionId}`]: null } });
const cell = (columnId: string, value: string, previous: string | null = null) => ({ memberId, columnId, value, previous });
const form = (cells = [cell('km', '12')]) => { const data = new FormData(); data.set('payload', JSON.stringify({ weekId, cells })); return data; };
const writes = () => Object.values(tx).reduce((sum, model) => sum + ('upsert' in model ? model.upsert.mock.calls.length : 0), 0);

beforeEach(() => {
    vi.resetAllMocks();
    guard.mockResolvedValue({ success: true, session: { user: { id: 'admin' } } });
    snapshot.mockResolvedValue({ week: { ...week, block: { ...week.block } }, columns: columns(), members: [member()] });
    db.$transaction.mockImplementation(async (operation: (client: typeof tx) => Promise<unknown>) => operation(tx));
});

describe('weekly check-in batch save', () => {
    it('rejects unauthorized callers before touching the database', async () => {
        guard.mockResolvedValue({ success: false, message: 'Unauthorized' });
        expect((await saveWeeklyCheckIn(null, form())).success).toBe(false);
        expect(db.$transaction).not.toHaveBeenCalled();
    });
    it('rejects malformed JSON and empty payloads', async () => {
        const broken = new FormData(); broken.set('payload', '{');
        expect((await saveWeeklyCheckIn(null, broken)).success).toBe(false);
        expect((await saveWeeklyCheckIn(null, form([]))).success).toBe(false);
        expect(db.$transaction).not.toHaveBeenCalled();
    });
    it('saves every category and an audit entry in one serializable transaction', async () => {
        const result = await saveWeeklyCheckIn(null, form([cell('weight-start', '88', '90'), cell('weight-end', '87'), cell('km', '1e2'), cell('lifestyle', '0'), cell(`attendance:${sessionId}`, 'absent')]));
        expect(result).toEqual({ success: true, message: 'Saved 5 check-in changes.' });
        expect(tx.weighIn.upsert).toHaveBeenCalledTimes(2);
        expect(tx.weighIn.upsert).toHaveBeenLastCalledWith(expect.objectContaining({ create: { memberId, date: new Date('2026-02-09T00:00:00Z'), weight: 87 } }));
        expect(tx.kmLog.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { totalKm: 100 } }));
        expect(tx.lifestyleLog.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { postCount: 0 } }));
        expect(tx.attendance.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { isPresent: false } }));
        expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'admin', action: 'SAVE_WEEKLY_CHECK_IN', entityId: weekId }) }));
        expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable', timeout: 30000 });
        expect(revalidatePath).toHaveBeenCalledWith('/check-in');
    });
    it('validates the whole batch before writing a valid first cell', async () => {
        const result = await saveWeeklyCheckIn(null, form([cell('km', '12'), cell('lifestyle', '1.5')]));
        expect(result.success).toBe(false);
        expect(writes()).toBe(0);
        expect(tx.auditLog.create).not.toHaveBeenCalled();
    });
    it('rejects finalized or inactive weeks', async () => {
        snapshot.mockResolvedValueOnce({ week: { ...week, isFinalized: true }, columns: columns(), members: [member()] });
        expect((await saveWeeklyCheckIn(null, form())).success).toBe(false);
        snapshot.mockResolvedValueOnce({ week: { ...week, block: { isActive: false } }, columns: columns(), members: [member()] });
        expect((await saveWeeklyCheckIn(null, form())).success).toBe(false);
        expect(writes()).toBe(0);
    });
    it('rejects weights locked by a neighboring finalized week', async () => {
        snapshot.mockResolvedValue({ week, columns: columns().map(column => column.id === 'weight-start' ? { ...column, locked: true } : column), members: [member()] });
        expect((await saveWeeklyCheckIn(null, form([cell('km', '12'), cell('weight-start', '88', '90')]))).success).toBe(false);
        expect(writes()).toBe(0);
    });
    it('rejects duplicate cells instead of silently choosing a value', async () => {
        expect((await saveWeeklyCheckIn(null, form([cell('km', '12'), cell('km', '14')]))).success).toBe(false);
        expect(writes()).toBe(0);
    });
    it('rejects members and sessions outside the current snapshot', async () => {
        expect((await saveWeeklyCheckIn(null, form([cell('attendance:other-session', 'present')]))).success).toBe(false);
        snapshot.mockResolvedValueOnce({ week, columns: columns(), members: [] });
        expect((await saveWeeklyCheckIn(null, form())).success).toBe(false);
        expect(writes()).toBe(0);
    });
    it('refuses to overwrite a value changed after the page loaded', async () => {
        const changed = member(); changed.values.km = '20';
        snapshot.mockResolvedValue({ week, columns: columns(), members: [changed] });
        const result = await saveWeeklyCheckIn(null, form([cell('km', '12')]));
        expect(result.success).toBe(false);
        expect(result.message).toMatch(/changed since/);
        expect(writes()).toBe(0);
    });
    it('does not confuse a recorded zero with a missing value', async () => {
        const changed = member(); changed.values.km = '0';
        snapshot.mockResolvedValue({ week, columns: columns(), members: [changed] });
        expect((await saveWeeklyCheckIn(null, form([cell('km', '12')]))).success).toBe(false);
        expect((await saveWeeklyCheckIn(null, form([cell('km', '12', '0')]))).success).toBe(true);
    });
    it('returns a recoverable failure and does not invalidate caches if the transaction fails', async () => {
        db.$transaction.mockRejectedValueOnce(new Error('serialization failure'));
        const log = vi.spyOn(console, 'error').mockImplementation(() => {});
        const result = await saveWeeklyCheckIn(null, form());
        expect(result.success).toBe(false);
        expect(result.message).toMatch(/draft is still here/);
        expect(revalidatePath).not.toHaveBeenCalled();
        log.mockRestore();
    });
    it('keeps audit creation inside the transaction, failing the batch if the audit cannot be recorded', async () => {
        tx.auditLog.create.mockRejectedValueOnce(new Error('audit unavailable'));
        const log = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect((await saveWeeklyCheckIn(null, form())).success).toBe(false);
        expect(revalidatePath).not.toHaveBeenCalled();
        log.mockRestore();
    });
});


it('reports a committed save as successful even if cache refresh subsequently fails', async () => {
    vi.mocked(revalidatePath).mockImplementationOnce(() => { throw new Error('cache unavailable'); });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await saveWeeklyCheckIn(null, form());
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/Saved 1.*Refresh/);
    expect(tx.auditLog.create).toHaveBeenCalledOnce();
    log.mockRestore();
});
