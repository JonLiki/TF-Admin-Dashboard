import { describe, expect, it } from 'vitest';
import { draftFormData, entryError, updateEntryDraft } from './entry-drafts';

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
