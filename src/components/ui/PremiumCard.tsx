import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function PremiumCard({ children, className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "bg-card/80 backdrop-blur-sm border border-border shadow-sm",
                "dark:bg-ocean-deep/80 dark:border-white/5 dark:shadow-[var(--shadow-md)]",
                "hover:-translate-y-1 hover:shadow-md hover:border-primary/20",
                "dark:hover:shadow-[var(--shadow-xl)] dark:hover:border-lagoon/20",
                "transition-all duration-300 ease-out active:scale-[0.99] active:shadow-sm",
                "text-card-foreground",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
