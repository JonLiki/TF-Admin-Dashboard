/**
 * Domain dates (weigh-in dates, week boundaries, session dates) are stored as
 * UTC midnight of the calendar day. Always normalize through these helpers
 * before writing or range-querying — never use setHours(), which works in the
 * server's local timezone and stores a different instant per deployment region.
 *
 * Inputs are either date-only strings ("YYYY-MM-DD", read as that calendar
 * day) or Dates / ISO datetimes already in UTC (truncated to their UTC date).
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function toUtcDateOnly(input: string | Date): Date {
    if (typeof input === 'string' && DATE_ONLY.test(input)) {
        return new Date(`${input}T00:00:00.000Z`);
    }
    const d = typeof input === 'string' ? new Date(input) : input;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Half-open [start, end) window covering one UTC calendar day. */
export function utcDayRange(input: string | Date): { start: Date; end: Date } {
    const start = toUtcDateOnly(input);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
}
