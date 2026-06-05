import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {

        const variants = {
            primary: "bg-gradient-to-r from-tongan to-tongan-dark text-white hover:from-tongan-dark hover:to-tongan shadow-lg shadow-tongan/20 hover:shadow-xl hover:shadow-tongan/30",
            secondary: "bg-ocean text-white hover:bg-ocean-light shadow-[var(--shadow-lg)] hover:shadow-xl",
            outline: "border border-lagoon/50 bg-transparent hover:bg-lagoon/10 text-lagoon-100 shadow-none hover:shadow-sm hover:shadow-lagoon/10",
            ghost: "relative hover:bg-white/5 text-slate-300 hover:text-white shadow-none after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[2px] after:bg-lagoon/50 after:rounded-full after:transition-all after:duration-300 hover:after:w-3/4",
            danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 shadow-none hover:shadow-sm hover:shadow-red-500/10",
        };

        const sizes = {
            sm: "h-9 px-[var(--spacing-md)] text-xs uppercase tracking-wider", // 36px height
            md: "h-11 px-[var(--spacing-lg)] py-2 text-sm",                    // 44px height (Standard touch target)
            lg: "h-14 px-[var(--spacing-xl)] text-base font-bold",             // 56px height
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tongan-red/50 focus-visible:ring-offset-1 focus-visible:ring-offset-obsidian disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
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

