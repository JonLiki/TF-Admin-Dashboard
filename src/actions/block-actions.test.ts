import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

const prismaMock = vi.hoisted(() => ({
    $transaction: vi.fn(),
    block: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    blockWeek: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    session: { create: vi.fn() },
    auditLog: { create: vi.fn() }
}));
vi.mock('@/lib/prisma', () => ({ default: prismaMock }));

import { auth } from '@/auth';
import { createBlock } from '@/actions/block-actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = vi.mocked(auth) as any;

const adminSession = {
    user: { id: 'u1', role: 'ADMIN' },
    expires: '2099-01-01T00:00:00.000Z'
};

function makeForm(name: string, startDate: string, numberOfWeeks: string) {
    const fd = new FormData();
    fd.append('name', name);
    fd.append('startDate', startDate);
    fd.append('numberOfWeeks', numberOfWeeks);
    return fd;
}

beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(adminSession);

    // Run the transaction callback against the same mock client
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => Promise<unknown>) => cb(prismaMock));
    prismaMock.block.create.mockResolvedValue({ id: 'b1', name: 'Test Block' });
    prismaMock.blockWeek.create.mockResolvedValue({ id: 'w1' });
    prismaMock.session.create.mockResolvedValue({ id: 's1' });
    prismaMock.auditLog.create.mockResolvedValue({ id: 'a1' });
});

describe('createBlock date anchoring', () => {
    it('anchors the block to UTC-midnight Monday regardless of server timezone', async () => {
        // 2026-01-21 is a Wednesday; the containing week starts Monday 2026-01-19
        const result = await createBlock(makeForm('Test Block', '2026-01-21', '2'));
        expect(result.success).toBe(true);

        const blockData = prismaMock.block.create.mock.calls[0][0].data;
        expect(blockData.startDate.toISOString()).toBe('2026-01-19T00:00:00.000Z');
        // 2 weeks: ends Sunday 2026-02-01 at UTC midnight
        expect(blockData.endDate.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    });

    it('creates weeks running Monday to Sunday at UTC midnight', async () => {
        await createBlock(makeForm('Test Block', '2026-01-19', '2'));

        const weekCalls = prismaMock.blockWeek.create.mock.calls.map(c => c[0].data);
        expect(weekCalls).toHaveLength(2);
        expect(weekCalls[0].startDate.toISOString()).toBe('2026-01-19T00:00:00.000Z');
        expect(weekCalls[0].endDate.toISOString()).toBe('2026-01-25T00:00:00.000Z');
        expect(weekCalls[1].startDate.toISOString()).toBe('2026-01-26T00:00:00.000Z');
        expect(weekCalls[1].endDate.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    });

    it('creates Mon/Wed/Fri sessions at UTC midnight', async () => {
        await createBlock(makeForm('Test Block', '2026-01-19', '1'));

        const sessionCalls = prismaMock.session.create.mock.calls.map(c => c[0].data);
        expect(sessionCalls).toHaveLength(3);
        expect(sessionCalls.map(s => s.date.toISOString())).toEqual([
            '2026-01-19T00:00:00.000Z', // Monday
            '2026-01-21T00:00:00.000Z', // Wednesday
            '2026-01-23T00:00:00.000Z'  // Friday
        ]);
        expect(sessionCalls.map(s => s.type)).toEqual(['Monday', 'Wednesday', 'Friday']);
    });
});
