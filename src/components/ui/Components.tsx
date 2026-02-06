import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

import { NgatuDivider } from './Patterns';

// --- BUTTON ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {

        const variants = {
            primary: "bg-[#C8102E] text-white hover:bg-[#A50D24] shadow-sm shadow-tongan/10 hover:shadow-md hover:shadow-tongan/20 active:translate-y-px transition-all",
            secondary: "bg-[#12394D] text-white hover:bg-[#1C4E68] shadow-sm active:translate-y-px transition-all",
            outline: "border border-white/10 bg-transparent hover:bg-white/5 text-white",
            ghost: "hover:bg-white/5 text-slate-400 hover:text-white",
            danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm active:translate-y-px",
        };

        const sizes = {
            sm: "h-9 px-3 text-xs rounded-md uppercase tracking-wide font-bold",
            md: "h-11 px-6 py-2 rounded-lg text-sm tracking-wide font-semibold",
            lg: "h-14 px-8 text-base rounded-xl tracking-wide font-semibold",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tongan/30 disabled:pointer-events-none disabled:opacity-50",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

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
                    <label className="text-sm font-medium text-charcoal pl-1">
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-11 w-full rounded-xl border border-charcoal/20 bg-white px-4 py-2 text-sm font-medium text-charcoal shadow-sm transition-all duration-200",
                        "placeholder:text-charcoal-muted/60 placeholder:font-normal",
                        "focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-4 focus-visible:ring-ocean/10 focus-visible:bg-white",
                        "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
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
    children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
    return (
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4 py-10 px-6 md:px-10 bg-[#0A1F2E] border-b border-white/5">
            <div className="relative z-10">
                <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
                {subtitle && <p className="text-offwhite/60 font-normal mt-1 text-sm">{subtitle}</p>}

                {/* Visual Anchor */}
                <NgatuDivider className="mt-6 text-white opacity-10 w-[120%]" />
            </div>
            {children && <div className="flex items-center gap-3 relative z-10">{children}</div>}
        </div>
    );
}
