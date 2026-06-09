/**
 * Authorization regression tests.
 *
 * Every mutating / import / export / scoring server action must reject callers
 * that are not ADMIN users. Server actions are public POST endpoints — page-level
 * middleware redirects are NOT sufficient protection.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ default: {} }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

import { auth } from '@/auth';
import * as memberTeamActions from '@/actions';
import * as blockActions from '@/actions/block-actions';
import * as dataActions from '@/actions/data';
import * as importActions from '@/actions/import-actions';
import * as exportActions from '@/actions/export-actions';
import * as scoringActions from '@/actions/scoring';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = vi.mocked(auth) as any;

const participantSession = {
    user: { id: 'u2', role: 'PARTICIPANT', memberId: 'm1', email: 'p@test.com' },
    expires: '2099-01-01T00:00:00.000Z'
};

const emptyForm = () => new FormData();

const fileForm = () => {
    const fd = new FormData();
    fd.append('file', new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' }));
    return fd;
};

/** Actions returning { success: false, message } on rejection */
const resultStyleActions: [string, () => Promise<{ success?: boolean; message?: string } | undefined | void>][] = [
    ['createTeam', () => memberTeamActions.createTeam(emptyForm())],
    ['updateTeam', () => memberTeamActions.updateTeam('t1', emptyForm())],
    ['createMember', () => memberTeamActions.createMember(emptyForm())],
    ['updateMember', () => memberTeamActions.updateMember('m1', emptyForm())],
    ['toggleMemberActive', () => memberTeamActions.toggleMemberActive('m1', true)],
    ['deleteMember', () => memberTeamActions.deleteMember('m1')],
    ['createBlock', () => blockActions.createBlock(emptyForm())],
    ['activateBlock', () => blockActions.activateBlock('b1')],
    ['deactivateBlock', () => blockActions.deactivateBlock('b1')],
    ['deleteBlock', () => blockActions.deleteBlock('b1')],
    ['finalizeWeek', () => blockActions.finalizeWeek('w1')],
    ['unfinalizeWeek', () => blockActions.unfinalizeWeek('w1')],
    ['submitWeighIn', () => dataActions.submitWeighIn(undefined, emptyForm())],
    ['submitKmLog', () => dataActions.submitKmLog(undefined, emptyForm())],
    ['submitLifestyleLog', () => dataActions.submitLifestyleLog(undefined, emptyForm())],
    ['submitBenchmarkLog', () => dataActions.submitBenchmarkLog(undefined, emptyForm())],
    ['importAttendance', () => importActions.importAttendance(fileForm())],
    ['importKm', () => importActions.importKm(fileForm())],
    ['importLifestyle', () => importActions.importLifestyle(fileForm())],
    ['importWeighIn', () => importActions.importWeighIn(fileForm())],
];

/** Actions that throw on rejection */
const throwStyleActions: [string, () => Promise<unknown>][] = [
    ['deleteTeam', () => memberTeamActions.deleteTeam('t1')],
    ['toggleAttendance', () => dataActions.toggleAttendance('s1', 'm1', true)],
    ['calculateWeekResults', () => scoringActions.calculateWeekResults('w1')],
    ['exportBlockData', () => exportActions.exportBlockData('b1', 'km')],
];

beforeEach(() => {
    mockAuth.mockReset();
});

describe('actions reject logged-in PARTICIPANT users', () => {
    describe('result-style actions', () => {
        for (const [name, invoke] of resultStyleActions) {
            it(`${name} rejects participants`, async () => {
                mockAuth.mockResolvedValue(participantSession);
                const result = await invoke();
                expect(result).toBeDefined();
                expect(result!.success).toBe(false);
                expect(result!.message).toMatch(/unauthorized|admin/i);
            });
        }
    });

    describe('throw-style actions', () => {
        for (const [name, invoke] of throwStyleActions) {
            it(`${name} rejects participants`, async () => {
                mockAuth.mockResolvedValue(participantSession);
                await expect(invoke()).rejects.toThrow(/unauthorized|admin/i);
            });
        }
    });
});

describe('actions reject unauthenticated callers', () => {
    describe('result-style actions', () => {
        for (const [name, invoke] of resultStyleActions) {
            it(`${name} rejects anonymous`, async () => {
                mockAuth.mockResolvedValue(null);
                const result = await invoke();
                expect(result).toBeDefined();
                expect(result!.success).toBe(false);
                expect(result!.message).toMatch(/unauthorized|admin/i);
            });
        }
    });

    describe('throw-style actions', () => {
        for (const [name, invoke] of throwStyleActions) {
            it(`${name} rejects anonymous`, async () => {
                mockAuth.mockResolvedValue(null);
                await expect(invoke()).rejects.toThrow(/unauthorized|admin/i);
            });
        }
    });
});
