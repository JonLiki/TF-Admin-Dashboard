import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));

import { auth } from '@/auth';
import { requireUser, requireAdmin } from '@/lib/auth-guard';

const mockAuth = vi.mocked(auth);

const adminSession = {
    user: { id: 'u1', role: 'ADMIN', email: 'admin@test.com' },
    expires: '2099-01-01T00:00:00.000Z'
};

const participantSession = {
    user: { id: 'u2', role: 'PARTICIPANT', memberId: 'm1', email: 'p@test.com' },
    expires: '2099-01-01T00:00:00.000Z'
};

beforeEach(() => {
    mockAuth.mockReset();
});

describe('requireUser', () => {
    it('rejects when there is no session', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockAuth.mockResolvedValue(null as any);
        const result = await requireUser();
        expect(result.success).toBe(false);
        if (!result.success) expect(result.message).toMatch(/unauthorized/i);
    });

    it('rejects when session has no user', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockAuth.mockResolvedValue({ expires: '2099-01-01T00:00:00.000Z' } as any);
        const result = await requireUser();
        expect(result.success).toBe(false);
    });

    it('accepts any logged-in user and returns the session', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockAuth.mockResolvedValue(participantSession as any);
        const result = await requireUser();
        expect(result.success).toBe(true);
        if (result.success) expect(result.session.user.id).toBe('u2');
    });
});

describe('requireAdmin', () => {
    it('rejects when there is no session', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockAuth.mockResolvedValue(null as any);
        const result = await requireAdmin();
        expect(result.success).toBe(false);
    });

    it('rejects a PARTICIPANT user', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockAuth.mockResolvedValue(participantSession as any);
        const result = await requireAdmin();
        expect(result.success).toBe(false);
        if (!result.success) expect(result.message).toMatch(/admin/i);
    });

    it('rejects a user with no role', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockAuth.mockResolvedValue({ user: { id: 'u3' }, expires: '2099-01-01T00:00:00.000Z' } as any);
        const result = await requireAdmin();
        expect(result.success).toBe(false);
    });

    it('accepts an ADMIN user and returns the session', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockAuth.mockResolvedValue(adminSession as any);
        const result = await requireAdmin();
        expect(result.success).toBe(true);
        if (result.success) expect(result.session.user.role).toBe('ADMIN');
    });
});
