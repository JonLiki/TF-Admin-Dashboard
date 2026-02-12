import React from 'react';
import { cn } from '@/lib/utils';


interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
    className?: string;
    as?: React.ElementType;
}

export function Heading({ children, className, as, size = 'h1', ...props }: TypographyProps & { size?: 'h1' | 'h2' | 'h3' | 'h4' }) {
    const Component = as || (size as React.ElementType);

    const sizes = {
        h1: "text-4xl font-black tracking-tight", // 36px
        h2: "text-3xl font-bold tracking-tight",  // 30px
        h3: "text-2xl font-bold tracking-normal", // 24px
        h4: "text-xl font-semibold tracking-wide" // 20px
    };

    return (
        <Component
            className={cn(
                "text-white font-display",
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
}

export function Text({ children, className, as = 'p', variant = 'body', ...props }: TypographyProps & { variant?: 'body' | 'caption' | 'small' | 'mono' }) {
    const Component = as;

    const variants = {
        body: "text-base text-slate-300 leading-relaxed font-sans", // 16px
        caption: "text-sm text-slate-400 leading-normal font-sans", // 14px
        small: "text-xs text-slate-500 font-medium font-sans",      // 12px
        mono: "text-sm text-lagoon-100 font-mono"                   // 14px mono
    };

    return (
        <Component
            className={cn(
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
}
