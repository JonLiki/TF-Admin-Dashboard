import React from 'react';
import { NgatuDivider } from './Patterns';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    showDivider?: boolean;
    children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, showDivider = true, children }: PageHeaderProps) {
    return (
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4 py-10 px-6 md:px-10 bg-surface-deep border-b border-white/5 overflow-hidden">
            {/* Ambient gradient behind header */}
            <div className="absolute inset-0 bg-gradient-to-r from-tongan/[0.03] via-transparent to-lagoon/[0.03] pointer-events-none" />

            <div className="relative z-10 w-full">
                <h1 className="text-3xl font-bold tracking-tight text-white font-display hover:text-gradient transition-all duration-300 cursor-default">{title}</h1>
                {subtitle && <p className="text-offwhite/60 font-normal mt-1 text-sm">{subtitle}</p>}

                {/* Visual Anchor conditionally rendered */}
                {showDivider && (
                    <div className="relative mt-6 w-full max-w-4xl">
                        <NgatuDivider className="h-1.5 opacity-40 relative z-10" />
                        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-lagoon/60 via-tongan-red/50 to-transparent blur-[2px] rounded-full" />
                        {/* Animated underline grow */}
                        <div className="absolute bottom-[-2px] left-0 h-[2px] bg-gradient-to-r from-lagoon to-transparent rounded-full animate-[page-enter_0.6s_ease-out]" style={{ width: '60%' }} />
                    </div>
                )}
            </div>
            {children && <div className="flex items-center gap-3 relative z-10">{children}</div>}
        </div>
    );
}

