'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface SheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

export function Sheet({ isOpen, onClose, children, title }: SheetProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!mounted) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sheet Content */}
            <div
                className={cn(
                    "fixed inset-x-0 bottom-0 z-[70] w-full bg-ocean-deep border-t border-white/10 shadow-2xl transition-transform duration-300 ease-out sm:max-w-md sm:right-0 sm:left-auto sm:h-full sm:border-l sm:border-t-0 rounded-t-2xl sm:rounded-none",
                    isOpen ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-x-full"
                )}
            >
                <div className="flex flex-col h-full max-h-[90vh] sm:max-h-screen">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                        <h2 className="text-lg font-bold text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {children}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
