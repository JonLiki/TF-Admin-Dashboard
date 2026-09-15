'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    side?: 'right' | 'left';
}

export function Sheet({ isOpen, onClose, children, title = 'Details', side = 'right' }: SheetProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog || !isOpen) {
            dialog?.close();
            return;
        }
        const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.showModal();
        return () => {
            dialog.close();
            if (trigger?.isConnected) trigger.focus();
        };
    }, [isOpen]);

    return (
        <dialog ref={dialogRef} aria-labelledby={titleId}
            onCancel={event => { event.preventDefault(); onClose(); }}
            onClick={event => { if (event.target === event.currentTarget) onClose(); }}
            className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-foreground backdrop:bg-black/60 backdrop:backdrop-blur-sm">
            <div className={cn('absolute flex flex-col bg-surface-deep border-border shadow-xl overflow-hidden',
                side === 'left' ? 'inset-y-0 left-0 w-72 max-w-[90vw]' : 'inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl sm:inset-y-0 sm:left-auto sm:w-[28rem] sm:max-w-full sm:max-h-none sm:rounded-none')}
                onClick={event => event.stopPropagation()}>
                <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
                    <h2 id={titleId} className="text-lg font-bold">{title}</h2>
                    <button type="button" onClick={onClose} aria-label="Close panel"
                        className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-lagoon">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
            </div>
        </dialog>
    );
}
