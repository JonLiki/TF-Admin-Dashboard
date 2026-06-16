import React from 'react';
import { KupesiBand } from './Patterns';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    showDivider?: boolean;
    children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, showDivider = true, children }: PageHeaderProps) {
    return (
        <div className="relative z-20 flex flex-col md:flex-row md:items-end justify-between gap-4 py-10 px-6 md:px-10 bg-surface-deep border-b border-white/5">
            {/* Ambient gradient behind header */}
            <div className="absolute inset-0 bg-gradient-to-r from-tongan/[0.03] via-transparent to-lagoon/[0.03] pointer-events-none" />

            <div className="relative z-10 w-full">
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-display hover:text-gradient transition-all duration-300 cursor-default">{title}</h1>
                {subtitle && <p className="text-foreground/50 font-normal mt-1 text-sm">{subtitle}</p>}

                {/* Visual Anchor conditionally rendered */}
                {showDivider && (
                    <div className="relative mt-5 w-72 max-w-full">
                        {/* Kupesi tapa band — the signature To'a Fatalona page motif */}
                        <KupesiBand />
                        {/* Fade the right edge so it reads as a deliberate motif, not a full rule */}
                        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-surface-deep to-transparent pointer-events-none" />
                    </div>
                )}
            </div>
            {children && <div className="flex items-center gap-3 relative z-10">{children}</div>}
        </div>
    );
}

