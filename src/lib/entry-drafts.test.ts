import { describe, expect, it } from 'vitest';
import { benchmarkDraftFormData, draftFormData, entryError, updateEntryDraft, updateEntryDraftBatch } from './entry-drafts';

describe('entry drafts', () => {
    it('saves edits to multiple members independently of which row is visible', () => {
        const first = updateEntryDraft({}, 'member-a', '95.5', '96');
        const drafts = updateEntryDraft(first, 'member-b', '0', '');
        const data = draftFormData(drafts, 'weight', 'date', '2026-01-19');
        expect(Object.fromEntries(data)).toEqual({ date: '2026-01-19', 'weight_member-a': '95.5', 'weight_member-b': '0' });
        expect(first).toEqual({ 'member-a': '95.5' });
    });

    it('removes an edit reverted to its saved numeric value without losing other edits', () => {
        expect(updateEntryDraft({ a: '10', b: '5' }, 'a', '2.00', '2')).toEqual({ b: '5' });
    });

    it('keeps explicit zero entries for previously empty records', () => {
        expect(updateEntryDraft({}, 'a', '0', '')).toEqual({ a: '0' });
        expect(entryError('0', 200)).toBeUndefined();
    });

    it('catches entries that the server would skip, including filtered-out drafts', () => {
        expect(entryError('', 500)).toBeDefined();
        expect(entryError('-1')).toBeDefined();
        expect(entryError('Infinity')).toBeDefined();
        expect(entryError('201', 200)).toBeDefined();
        expect(entryError('1.5', undefined, true)).toBeDefined();
        expect(entryError('200', 200)).toBeUndefined();
    });

    it('submits only edited members and the selected week', () => {
        expect(Object.fromEntries(draftFormData({ b: '12' }, 'km', 'blockWeekId', 'week-2')))
            .toEqual({ blockWeekId: 'week-2', km_b: '12' });
    });
});


describe('benchmark drafts', () => {
    const members = [
        { id: 'a', benchmarkLogs: [{ squats: 12, pushups: 7, burpees: 3 }] },
        { id: 'b', benchmarkLogs: [] },
        { id: 'c', benchmarkLogs: [{ squats: 5, pushups: 4, burpees: 2 }] },
    ];
    it('preserves unchanged scores when one score is edited, including zero', () => {
        const data = benchmarkDraftFormData({ squats_a: '0' }, members, 'week-8', '2026-03-09');
        expect(Object.fromEntries(data)).toEqual({
            blockWeekId: 'week-8', date: '2026-03-09', squats_a: '0', pushups_a: '7', burpees_a: '3',
        });
    });
    it('includes edits to filtered-out rows and excludes untouched members', () => {
        const data = benchmarkDraftFormData({ pushups_a: '10', burpees_b: '8' }, members, 'week-1', '2026-01-19');
        expect(data.get('squats_a')).toBe('12');
        expect(data.get('pushups_a')).toBe('10');
        expect(data.get('squats_b')).toBe('0');
        expect(data.get('burpees_b')).toBe('8');
        expect(data.has('squats_c')).toBe(false);
    });
    it('normalizes scientific notation to avoid truncation by integer parsing', () => {
        const data = benchmarkDraftFormData({ squats_a: '1e2' }, members, 'week-1', '2026-01-19');
        expect(data.get('squats_a')).toBe('100');
    });
});


describe('pasted draft batches', () => {
    it('applies a range without losing hidden edits or mutating the previous draft', () => {
        const previous = { hidden: '5', revert: '12', changed: '9' };
        const next = updateEntryDraftBatch(previous, [
            { id: 'revert', value: '2.0', saved: '2' },
            { id: 'changed', value: '0', saved: '' },
            { id: 'attendance', value: 'absent', saved: '' },
        ]);
        expect(next).toEqual({ hidden: '5', changed: '0', attendance: 'absent' });
        expect(previous).toEqual({ hidden: '5', revert: '12', changed: '9' });
    });
});
