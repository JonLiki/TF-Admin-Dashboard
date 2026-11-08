'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { draftFormData, entryError, updateEntryDraft, type EntryDrafts } from '@/lib/entry-drafts';

// Memory-only drafts also survive client-side back/forward navigation.
const draftCache = new Map<string, EntryDrafts>();
export function clearEntryDraftCache() { draftCache.clear(); }

type Result = { success: boolean; message: string };

export function useEntryDrafts(action: (previous: unknown, data: FormData) => Promise<Result>,
    prefix: string, contextName: string, context: string, max?: number, integer = false, serialize?: (drafts: EntryDrafts) => FormData) {
    const cacheKey = `${prefix}:${contextName}:${context}`;
    const [drafts, setDrafts] = useState<EntryDrafts>(() => draftCache.get(cacheKey) ?? {});
    const afterSave = useRef<(() => void) | null>(null);
    const dirtyRef = useRef(Object.keys(drafts).length > 0);
    const discard = () => { dirtyRef.current = false; draftCache.delete(cacheKey); setDrafts({}); };
    const formRef = useRef<HTMLFormElement>(null);
    const errors = Object.fromEntries(Object.entries(drafts)
        .map(([id, value]) => [id, entryError(value, max, integer)])
        .filter(([, error]) => error));
    const count = Object.keys(drafts).length;
    const [state, formAction, isPending] = useActionState(async () => {
        if (Object.keys(errors).length) {
            afterSave.current = null;
            return { success: false, message: 'Correct the highlighted entries before saving. Some may be hidden by your search.' };
        }
        try {
            const result = await action(null, serialize ? serialize(drafts) : draftFormData(drafts, prefix, contextName, context));
            if (result.success) {
                discard();
            } else { afterSave.current = null; }
            return result;
        } catch {
            afterSave.current = null;
            return { success: false, message: 'Could not save. Your changes are still here; please try again.' };
        }
    }, null);

    useEffect(() => {
        const save = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                if (count && !isPending) formRef.current?.requestSubmit();
            }
        };
        const beforeUnload = (event: BeforeUnloadEvent) => {
            if (dirtyRef.current) { event.preventDefault(); event.returnValue = ''; }
        };
        document.addEventListener('keydown', save);
        window.addEventListener('beforeunload', beforeUnload);
        return () => {
            document.removeEventListener('keydown', save);
            window.removeEventListener('beforeunload', beforeUnload);
        };
    }, [count, isPending]);

    useEffect(() => {
        if (!count && state?.success && afterSave.current) {
            const navigate = afterSave.current;
            afterSave.current = null;
            navigate();
        }
    }, [count, state]);

    return { drafts, errors, count, state, formAction, isPending, formRef, discard,
        saveBeforeLeaving: (navigate: () => void) => { afterSave.current = navigate; formRef.current?.requestSubmit(); },
        change: (id: string, value: string, saved: string) => setDrafts(current => {
            const next = updateEntryDraft(current, id, value, saved);
            dirtyRef.current = Object.keys(next).length > 0;
            draftCache.set(cacheKey, next);
            return next;
        }) };
}
