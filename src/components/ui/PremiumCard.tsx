import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function PremiumCard({ children, className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "bg-ocean-deep/80 backdrop-blur-sm border border-white/5 shadow-[var(--shadow-md)]",
                "hover:-translate-y-1 hover:shadow-[var(--shadow-xl)] hover:border-lagoon/20",
                "transition-all duration-300 ease-out active:scale-[0.99] active:shadow-[var(--shadow-lg)]",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
