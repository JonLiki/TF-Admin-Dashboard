import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, id, ...props }, ref) => {
        const generatedId = React.useId();
        const inputId = id ?? generatedId;
        const errorId = `${inputId}-error`;
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-foreground/70 pl-1">
                        {label}
                    </label>
                )}
                <input
                    id={inputId}
                    type={type}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className={cn(
                        "flex h-11 w-full rounded-xl border border-white/10 bg-surface-ocean/30 px-4 py-2 text-sm font-medium text-foreground shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] backdrop-blur-md transition-all duration-300",
                        "placeholder:text-foreground/50 placeholder:font-normal",
                        "focus-visible:outline-none focus-visible:border-lagoon/50 focus-visible:ring-4 focus-visible:ring-lagoon/15 focus-visible:bg-surface-ocean/60 focus-visible:shadow-[0_0_20px_rgba(102,252,241,0.15)]",
                        "disabled:cursor-not-allowed disabled:bg-gray-800/50 disabled:text-gray-500",
                        error && "border-tongan focus-visible:border-tongan focus-visible:ring-tongan/15 focus-visible:shadow-[0_0_20px_rgba(197,0,0,0.2)]",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && <p id={errorId} className="text-xs text-tongan font-medium">{error}</p>}
            </div>
        );
    }
);
Input.displayName = "Input";
