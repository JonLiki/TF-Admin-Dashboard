'use client';

import { useEffect, useCallback } from 'react';

type KeyCombo = {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
};

/**
 * Hook to register keyboard shortcuts
 * Automatically prevents default browser behavior for matched combos
 */
export function useKeyboardShortcut(
    combo: KeyCombo,
    callback: (e: KeyboardEvent) => void,
    enabled = true
) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!enabled) return;

            const keyMatch = e.key.toLowerCase() === combo.key.toLowerCase();
            const ctrlMatch = combo.ctrl ? (e.ctrlKey || e.metaKey) : true;
            const shiftMatch = combo.shift ? e.shiftKey : true;
            const altMatch = combo.alt ? e.altKey : true;

            if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                e.preventDefault();
                callback(e);
            }
        },
        [combo, callback, enabled]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

/**
 * Hook to prevent Ctrl+S browser save dialog across the app
 * Optionally triggers a custom callback
 */
export function usePreventBrowserSave(onSave?: () => void) {
    useKeyboardShortcut(
        { key: 's', ctrl: true },
        () => {
            if (onSave) onSave();
        }
    );
}
