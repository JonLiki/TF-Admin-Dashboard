'use client';

import { useEffect, useState } from 'react';
import { Sheet } from './Sheet';
import { Button } from './Button';

const navigationEvent = 'entry-navigation';
export function navigateWithDraftCheck(navigate: () => void) {
    const event = new CustomEvent(navigationEvent, { cancelable: true, detail: navigate });
    if (window.dispatchEvent(event)) navigate();
}

export function UnsavedChangesGuard({ dirty, isPending, onSave, onDiscard, message }: {
    dirty: boolean; isPending: boolean; onSave: (afterSave: () => void) => void; onDiscard: () => void; message?: string;
}) {
    const [destination, setDestination] = useState<(() => void) | null>(null);
    useEffect(() => {
        if (!dirty && !isPending) return;
        const request = (event: Event) => {
            event.preventDefault();
            if (!isPending) setDestination(() => (event as CustomEvent<() => void>).detail);
        };
        const click = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
            if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
            const target = new URL(link.href);
            if (target.pathname === location.pathname && target.search === location.search && target.hash) return;
            event.preventDefault();
            event.stopPropagation();
            if (!isPending) setDestination(() => () => { window.location.assign(link.href); });
        };
        window.addEventListener(navigationEvent, request);
        document.addEventListener('click', click, true);
        return () => {
            window.removeEventListener(navigationEvent, request);
            document.removeEventListener('click', click, true);
        };
    }, [dirty, isPending]);
    return <Sheet isOpen={!!destination} onClose={() => { if (!isPending) setDestination(null); }} title="Unsaved changes">
        <p className="mb-5 text-sm">Save your changes before leaving, or discard them to continue.</p>
        {message && <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-300">{message}</p>}
        <div className="flex flex-wrap gap-2">
            <Button type="button" isLoading={isPending} onClick={() => destination && onSave(() => { setDestination(null); destination(); })}>Save and continue</Button>
            <Button type="button" variant="danger" disabled={isPending} onClick={() => { onDiscard(); setDestination(null); destination?.(); }}>Discard and continue</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => setDestination(null)}>Stay here</Button>
        </div>
    </Sheet>;
}
