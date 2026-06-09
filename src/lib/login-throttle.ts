/**
 * In-memory login throttle: after MAX_ATTEMPTS failed logins for a key
 * (normally the email), further attempts are rejected until LOCKOUT_MS has
 * passed since the last failure.
 *
 * Per-process state only — on serverless/multi-instance deployments each
 * instance tracks its own counters. That still blunts online brute-force
 * attacks; move to a shared store (DB/Redis) if stronger guarantees are needed.
 */

export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

interface AttemptRecord {
    count: number;
    lastFailureAt: number;
}

const attempts = new Map<string, AttemptRecord>();

function isStale(record: AttemptRecord, now: number): boolean {
    return now - record.lastFailureAt > LOCKOUT_MS;
}

export function isLockedOut(key: string, now: number = Date.now()): boolean {
    const record = attempts.get(key);
    if (!record) return false;
    if (isStale(record, now)) {
        attempts.delete(key);
        return false;
    }
    return record.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string, now: number = Date.now()): void {
    const record = attempts.get(key);
    if (!record || isStale(record, now)) {
        attempts.set(key, { count: 1, lastFailureAt: now });
        return;
    }
    record.count += 1;
    record.lastFailureAt = now;
}

export function clearAttempts(key: string): void {
    attempts.delete(key);
}

/** Test helper — wipe all throttle state. */
export function resetThrottleState(): void {
    attempts.clear();
}
