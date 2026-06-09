import { describe, it, expect } from 'vitest';
import { toUtcDateOnly, utcDayRange, addUtcDays } from '@/lib/dates';

describe('toUtcDateOnly', () => {
    it('parses a YYYY-MM-DD string as UTC midnight', () => {
        expect(toUtcDateOnly('2026-01-19').toISOString()).toBe('2026-01-19T00:00:00.000Z');
    });

    it('truncates an ISO datetime string to its UTC date', () => {
        expect(toUtcDateOnly('2026-01-19T15:30:45.123Z').toISOString()).toBe('2026-01-19T00:00:00.000Z');
    });

    it('truncates a Date object to its UTC date', () => {
        expect(toUtcDateOnly(new Date('2026-01-19T23:59:59.999Z')).toISOString()).toBe('2026-01-19T00:00:00.000Z');
    });

    it('is idempotent on UTC midnight', () => {
        const d = toUtcDateOnly('2026-01-19');
        expect(toUtcDateOnly(d).toISOString()).toBe(d.toISOString());
    });

    it('does not shift the date across month boundaries', () => {
        expect(toUtcDateOnly('2026-01-31T23:00:00.000Z').toISOString()).toBe('2026-01-31T00:00:00.000Z');
        expect(toUtcDateOnly('2026-02-01T00:00:00.000Z').toISOString()).toBe('2026-02-01T00:00:00.000Z');
    });
});

describe('addUtcDays', () => {
    it('adds exact 24h days, keeping UTC midnight regardless of local DST', () => {
        // NZ DST ends 2026-04-05; local-calendar arithmetic would drift an hour here
        const start = new Date('2026-03-30T00:00:00.000Z');
        expect(addUtcDays(start, 7).toISOString()).toBe('2026-04-06T00:00:00.000Z');
        expect(addUtcDays(start, 14).toISOString()).toBe('2026-04-13T00:00:00.000Z');
    });

    it('supports negative offsets', () => {
        const d = new Date('2026-01-19T00:00:00.000Z');
        expect(addUtcDays(d, -3).toISOString()).toBe('2026-01-16T00:00:00.000Z');
    });
});

describe('utcDayRange', () => {
    it('returns the [start, nextDay) window for a UTC calendar day', () => {
        const { start, end } = utcDayRange('2026-01-19T10:00:00.000Z');
        expect(start.toISOString()).toBe('2026-01-19T00:00:00.000Z');
        expect(end.toISOString()).toBe('2026-01-20T00:00:00.000Z');
    });

    it('handles month rollover', () => {
        const { start, end } = utcDayRange('2026-01-31');
        expect(start.toISOString()).toBe('2026-01-31T00:00:00.000Z');
        expect(end.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    });
});
