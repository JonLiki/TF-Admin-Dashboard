import { describe, expect, it, vi } from 'vitest';
import { getMemberProgress } from './memberProgress';

describe('getMemberProgress', () => {
    it('handles a member with no records', () => {
        expect(getMemberProgress([], [])).toEqual({
            weighInCount: 0, startWeight: null, latestWeight: null,
            kgLost: null, pctChange: null, trend: [], sessionsAttended: 0, streak: 0,
        });
    });

    it('sorts weigh-ins without mutating input and stops the streak at a gap', () => {
        const weighIns = [
            { date: '2026-02-09', weight: 97 },
            { date: '2026-01-19', weight: 100 },
            { date: '2026-02-02', weight: 98 },
        ];
        const result = getMemberProgress(weighIns, [{ isPresent: true }, { isPresent: false }]);
        expect(result).toMatchObject({
            startWeight: 100, latestWeight: 97, kgLost: 3, pctChange: -3,
            sessionsAttended: 1, streak: 2,
        });
        expect(result.trend.map(point => point.weight)).toEqual([100, 98, 97]);
        expect(weighIns[0].weight).toBe(97);
    });

    it('formats domain dates explicitly in UTC', () => {
        const format = vi.spyOn(Date.prototype, 'toLocaleDateString');
        try {
            getMemberProgress([{ date: '2026-01-19T00:00:00.000Z', weight: 100 }], []);
            expect(format).toHaveBeenCalledWith('en-NZ', {
                month: 'short', day: 'numeric', timeZone: 'UTC',
            });
        } finally {
            format.mockRestore();
        }
    });
});
