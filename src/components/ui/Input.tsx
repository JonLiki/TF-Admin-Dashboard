import React from 'react';
import { cn } from '@/lib/utils';

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
