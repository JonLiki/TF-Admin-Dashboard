import { describe, expect, it } from 'vitest';
import { checkInColumns, checkInError, normalizeCheckInValue, parseClipboard, previewCheckInPaste, checkInFormData, CheckInPayloadSchema, type CheckInColumn, type CheckInMember } from './check-in';

const columns: CheckInColumn[] = [
    { id: 'weight-start', label: 'Weight', kind: 'weight', locked: false },
    { id: 'km', label: 'KM', kind: 'km', locked: false },
    { id: 'lifestyle', label: 'Posts', kind: 'lifestyle', locked: false },
    { id: 'attendance:session', label: 'Monday', kind: 'attendance', locked: false },
];
const members: CheckInMember[] = ['a', 'b'].map(id => ({ id, name: id.toUpperCase(), teamId: null, teamName: 'Unassigned', values: { 'weight-start': '90', km: null, lifestyle: null, 'attendance:session': null } }));

describe('check-in clipboard', () => {
    it('reads Excel TSV, Windows newlines, quoted cells and trailing newlines', () => {
        expect(parseClipboard('"85.5"\t12\t0\tPresent\r\n86\t10\t2\tAbsent\r\n')).toEqual([['85.5', '12', '0', 'Present'], ['86', '10', '2', 'Absent']]);
        expect(parseClipboard('"a""b"\t"multi\nline"')).toEqual([['a"b', 'multi\nline']]);
    });
    it('accepts comma-separated value blocks', () => {
        expect(parseClipboard('85,12\n86,10')).toEqual([['85', '12'], ['86', '10']]);
    });
    it('rejects unfinished quotes', () => { expect(() => parseClipboard('"85\t12')).toThrow(/unfinished/); });
    it('pastes starting at the focused cell, in visible member order', () => {
        const result = previewCheckInPaste('4\t0\tA', [members[1]], columns, 0, 1);
        expect(result.map(cell => [cell.key, cell.value])).toEqual([['b|km', '4'], ['b|lifestyle', '0'], ['b|attendance:session', 'absent']]);
    });
    it('skips blank cells and dashes without converting them into zeros', () => {
        const result = previewCheckInPaste('\t-\t0\t0', members, columns, 0, 0);
        expect(result.map(cell => [cell.column, cell.value])).toEqual([['Posts', '0'], ['Monday', 'absent']]);
    });
    it('rejects ranges that overflow rows or columns rather than truncating them', () => {
        expect(() => previewCheckInPaste('1\n2', members, columns, 1, 0)).toThrow(/extends beyond/);
        expect(() => previewCheckInPaste('1\t2', members, columns, 0, 3)).toThrow(/extends beyond/);
    });
    it('flags every invalid or locked cell before applying the range', () => {
        const result = previewCheckInPaste('85\t201\t1.5\tMaybe', members, [{ ...columns[0], locked: true }, ...columns.slice(1)], 0, 0);
        expect(result.every(cell => cell.error)).toBe(true);
    });
    it('rejects empty ranges', () => { expect(() => previewCheckInPaste('\t-\n', members, columns, 0, 0)).toThrow(/nonblank|no values/); });
});

describe('check-in field rules and dates', () => {
    it('preserves explicit numeric zero and absence', () => {
        expect(checkInError('0', columns[0])).toBeUndefined();
        expect(checkInError('0', columns[3])).toBeUndefined();
        expect(normalizeCheckInValue('FALSE', columns[3])).toBe('absent');
        expect(normalizeCheckInValue('p', columns[3])).toBe('present');
    });
    it('validates full values, bounds, integer posts and blanks', () => {
        for (const value of ['', 'Infinity', '-1', '12abc']) expect(checkInError(value, columns[1])).toBeDefined();
        expect(checkInError('500.1', columns[0])).toBeDefined();
        expect(checkInError('201', columns[1])).toBeDefined();
        expect(checkInError('2.2', columns[2])).toBeDefined();
        expect(checkInError('2147483648', columns[2])).toBeDefined();
        expect(normalizeCheckInValue('1e2', columns[1])).toBe('100');
    });
    it('locks shared weights covered by a neighboring finalized week', () => {
        const week = { startDate: new Date('2026-02-02T00:00:00Z'), isFinalized: false };
        const result = checkInColumns(week, [], [{ startDate: new Date('2026-01-26T00:00:00Z') }]);
        expect(result[0].locked).toBe(true);
        expect(result[1].locked).toBe(false);
        expect(result[1].date).toBe('2026-02-09T00:00:00.000Z');
        expect(result[2].locked).toBe(false);
    });
    it('locks the end weight when the next week is finalized', () => {
        const result = checkInColumns({ startDate: new Date('2026-02-02T00:00:00Z'), isFinalized: false }, [], [{ startDate: new Date('2026-02-09T00:00:00Z') }]);
        expect(result[0].locked).toBe(false);
        expect(result[1].locked).toBe(true);
    });
    it('locks all columns in the selected finalized week', () => {
        const result = checkInColumns({ startDate: new Date('2026-02-02T00:00:00Z'), isFinalized: true }, [{ id: 's', type: 'Monday', date: new Date('2026-02-02T00:00:00Z') }], []);
        expect(result.every(column => column.locked)).toBe(true);
    });
    it('serializes edits from every member, including hidden rows, with original values', () => {
        const form = checkInFormData({ 'a|weight-start': '88', 'b|lifestyle': '0', 'b|attendance:session': 'absent' }, members, columns, 'week');
        expect(JSON.parse(String(form.get('payload')))).toEqual({ weekId: 'week', cells: [
            { memberId: 'a', columnId: 'weight-start', value: '88', previous: '90' },
            { memberId: 'b', columnId: 'lifestyle', value: '0', previous: null },
            { memberId: 'b', columnId: 'attendance:session', value: 'absent', previous: null },
        ] });
    });
    it('rejects malformed or empty action payloads', () => {
        expect(CheckInPayloadSchema.safeParse({ weekId: 'not-a-week', cells: [] }).success).toBe(false);
    });
});


it('keeps removed-member drafts in the payload for server rejection rather than silently discarding edits', () => {
    const data = checkInFormData({ 'removed|km': '12', 'a|km': '1e2' }, members, columns, 'week');
    expect(JSON.parse(String(data.get('payload'))).cells).toEqual([
        { memberId: 'removed', columnId: 'km', value: '12', previous: null },
        { memberId: 'a', columnId: 'km', value: '100', previous: null },
    ]);
});
