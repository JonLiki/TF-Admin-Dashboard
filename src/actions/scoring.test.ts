import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

// Separate tx mock so tests can tell "inside the transaction" apart from
// direct prisma calls — that distinction is the atomicity guarantee.
const { prismaMock, txMock } = vi.hoisted(() => {
    const txMock = {
        teamWeekMetric: { upsert: vi.fn(), update: vi.fn() },
        teamWeekAward: { deleteMany: vi.fn(), create: vi.fn() },
        pointLedger: { deleteMany: vi.fn(), create: vi.fn() },
        blockWeek: { update: vi.fn() }
    };
    const prismaMock = {
        blockWeek: { findUnique: vi.fn(), update: vi.fn() },
        team: { findMany: vi.fn() },
        auditLog: { create: vi.fn() },
        $transaction: vi.fn()
    };
    return { prismaMock, txMock };
});
vi.mock('@/lib/prisma', () => ({ default: prismaMock }));

import { auth } from '@/auth';
import { calculateWeekResults } from '@/actions/scoring';
import { finalizeWeek } from '@/actions/block-actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = vi.mocked(auth) as any;

const adminSession = {
    user: { id: 'u1', role: 'ADMIN' },
    expires: '2099-01-01T00:00:00.000Z'
};

const week = (overrides: Record<string, unknown> = {}) => ({
    id: 'w1',
    blockId: 'b1',
    weekNumber: 1,
    startDate: new Date('2026-01-19T00:00:00.000Z'),
    endDate: new Date('2026-01-25T00:00:00.000Z'),
    isFinalized: false,
    block: { id: 'b1', weeks: [] },
    ...overrides
});

beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(adminSession);
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock));
    prismaMock.team.findMany.mockResolvedValue([]);
    prismaMock.auditLog.create.mockResolvedValue({});
});

describe('calculateWeekResults', () => {
    it('refuses to recalculate an already-finalized week', async () => {
        prismaMock.blockWeek.findUnique.mockResolvedValue(week({ isFinalized: true }));

        await expect(calculateWeekResults('w1')).rejects.toThrow(/finalized/i);
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('locks the week inside the scoring transaction when asked to', async () => {
        prismaMock.blockWeek.findUnique.mockResolvedValue(week());

        await calculateWeekResults('w1', { lockWeek: true });

        expect(txMock.blockWeek.update).toHaveBeenCalledWith({
            where: { id: 'w1' },
            data: { isFinalized: true }
        });
    });

    it('does not lock the week when recalculating without the lock flag', async () => {
        prismaMock.blockWeek.findUnique.mockResolvedValue(week());

        await calculateWeekResults('w1');

        expect(txMock.blockWeek.update).not.toHaveBeenCalled();
    });
});

describe('finalizeWeek', () => {
    it('locks the week atomically with the scoring writes (no separate update)', async () => {
        prismaMock.blockWeek.findUnique.mockResolvedValue(week());

        const result = await finalizeWeek('w1');

        expect(result.success).toBe(true);
        expect(txMock.blockWeek.update).toHaveBeenCalledWith({
            where: { id: 'w1' },
            data: { isFinalized: true }
        });
        // The lock must NOT happen as a second, non-transactional write
        expect(prismaMock.blockWeek.update).not.toHaveBeenCalled();
    });

    it('still refuses a week that is already finalized', async () => {
        prismaMock.blockWeek.findUnique.mockResolvedValue(week({ isFinalized: true }));

        const result = await finalizeWeek('w1');

        expect(result.success).toBe(false);
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
});
