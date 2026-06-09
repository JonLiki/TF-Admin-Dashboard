import { describe, it, expect, beforeEach } from 'vitest';
import {
    isLockedOut,
    recordFailedAttempt,
    clearAttempts,
    resetThrottleState,
    MAX_ATTEMPTS,
    LOCKOUT_MS
} from '@/lib/login-throttle';

const T0 = 1_000_000_000_000; // fixed base timestamp

beforeEach(() => {
    resetThrottleState();
});

describe('login throttle', () => {
    it('is not locked out with no failed attempts', () => {
        expect(isLockedOut('a@test.com', T0)).toBe(false);
    });

    it('is not locked out below the attempt limit', () => {
        for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
            recordFailedAttempt('a@test.com', T0 + i);
        }
        expect(isLockedOut('a@test.com', T0 + MAX_ATTEMPTS)).toBe(false);
    });

    it('locks out after reaching the attempt limit', () => {
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            recordFailedAttempt('a@test.com', T0 + i);
        }
        expect(isLockedOut('a@test.com', T0 + MAX_ATTEMPTS)).toBe(true);
    });

    it('unlocks after the lockout window expires', () => {
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            recordFailedAttempt('a@test.com', T0 + i);
        }
        expect(isLockedOut('a@test.com', T0 + LOCKOUT_MS + 1000)).toBe(false);
    });

    it('resets the counter after the window expires (stale failures do not accumulate)', () => {
        for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
            recordFailedAttempt('a@test.com', T0 + i);
        }
        // One more failure long after the window — should count as 1, not 5
        recordFailedAttempt('a@test.com', T0 + LOCKOUT_MS + 1000);
        expect(isLockedOut('a@test.com', T0 + LOCKOUT_MS + 2000)).toBe(false);
    });

    it('clears attempts on successful login', () => {
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            recordFailedAttempt('a@test.com', T0 + i);
        }
        clearAttempts('a@test.com');
        expect(isLockedOut('a@test.com', T0 + MAX_ATTEMPTS)).toBe(false);
    });

    it('tracks keys independently', () => {
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            recordFailedAttempt('a@test.com', T0 + i);
        }
        expect(isLockedOut('a@test.com', T0 + MAX_ATTEMPTS)).toBe(true);
        expect(isLockedOut('b@test.com', T0 + MAX_ATTEMPTS)).toBe(false);
    });
});
