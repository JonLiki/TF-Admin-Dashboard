import React from 'react';
import { cn } from '@/lib/utils';
import { NgatuDivider } from './Patterns';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    showDivider?: boolean;
    children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, showDivider = true, children }: PageHeaderProps) {
    return (
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4 py-10 px-6 md:px-10 bg-surface-deep border-b border-white/5">
            <div className="relative z-10">
                <h1 className="text-3xl font-bold tracking-tight text-white font-display">{title}</h1>
                {subtitle && <p className="text-offwhite/60 font-normal mt-1 text-sm">{subtitle}</p>}

                {/* Visual Anchor conditionally rendered */}
                {showDivider && <NgatuDivider className="mt-6 text-white opacity-10 w-[120%]" />}
            </div>
            {children && <div className="flex items-center gap-3 relative z-10">{children}</div>}
        </div>
    );
}
