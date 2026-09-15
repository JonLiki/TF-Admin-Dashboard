'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { draftFormData, entryError, updateEntryDraft, type EntryDrafts } from '@/lib/entry-drafts';

type Result = { success: boolean; message: string };

export function useEntryDrafts(action: (previous: unknown, data: FormData) => Promise<Result>,
    prefix: string, contextName: string, context: string, max?: number, integer = false) {
    const [drafts, setDrafts] = useState<EntryDrafts>({});
    const formRef = useRef<HTMLFormElement>(null);
    const errors = Object.fromEntries(Object.entries(drafts)
        .map(([id, value]) => [id, entryError(value, max, integer)])
        .filter(([, error]) => error));
    const count = Object.keys(drafts).length;
    const [state, formAction, isPending] = useActionState(async () => {
        if (Object.keys(errors).length) return { success: false, message: 'Correct the highlighted entries before saving. Some may be hidden by your search.' };
        try {
            const result = await action(null, draftFormData(drafts, prefix, contextName, context));
            if (result.success) setDrafts({});
            return result;
        } catch {
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
            if (count) event.preventDefault();
        };
        document.addEventListener('keydown', save);
        window.addEventListener('beforeunload', beforeUnload);
        return () => {
            document.removeEventListener('keydown', save);
            window.removeEventListener('beforeunload', beforeUnload);
        };
    }, [count, isPending]);

    return { drafts, errors, count, state, formAction, isPending, formRef,
        change: (id: string, value: string, saved: string) => setDrafts(current => updateEntryDraft(current, id, value, saved)) };
}
