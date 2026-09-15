export type EntryDrafts = Record<string, string>;

export function updateEntryDraft(drafts: EntryDrafts, id: string, value: string, saved: string): EntryDrafts {
    const next = { ...drafts };
    if (value === saved || (value.trim() !== '' && saved !== '' && Number(value) === Number(saved))) {
        delete next[id];
    } else {
        next[id] = value;
    }
    return next;
}

export function entryError(value: string, max?: number, integer = false): string | undefined {
    if (!value.trim()) return 'Enter a value. Clearing a field does not delete a saved record.';
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return 'Enter a number of zero or more.';
    if (max !== undefined && number > max) return `Enter a value of ${max} or less.`;
    if (integer && !Number.isInteger(number)) return 'Enter a whole number.';
}

export function draftFormData(drafts: EntryDrafts, prefix: string, contextName: string, context: string): FormData {
    const data = new FormData();
    data.set(contextName, context);
    for (const [id, value] of Object.entries(drafts)) data.set(`${prefix}_${id}`, value);
    return data;
}
