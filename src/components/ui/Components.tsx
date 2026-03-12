import React from 'react';
import { cn } from '@/lib/utils';

import { NgatuDivider } from './Patterns';

// --- BUTTON (re-exported from canonical source) ---
export { Button } from './Button';


// --- INPUT ---
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="text-sm font-medium text-slate-300 pl-1">
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-11 w-full rounded-xl border border-white/10 bg-surface-ocean/50 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200",
                        "placeholder:text-slate-500 placeholder:font-normal",
                        "focus-visible:outline-none focus-visible:border-ocean-light focus-visible:ring-4 focus-visible:ring-ocean-light/10 focus-visible:bg-surface-ocean",
                        "disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500",
                        error && "border-tongan focus-visible:ring-tongan/10",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && <p className="text-xs text-tongan font-medium">{error}</p>}
            </div>
        );
    }
);
Input.displayName = "Input";

// --- PAGE HEADER ---
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
                <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
                {subtitle && <p className="text-offwhite/60 font-normal mt-1 text-sm">{subtitle}</p>}

                {/* Visual Anchor conditionally rendered */}
                {showDivider && <NgatuDivider className="mt-6 text-white opacity-10 w-[120%]" />}
            </div>
            {children && <div className="flex items-center gap-3 relative z-10">{children}</div>}
        </div>
    );
}
