import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function PremiumCard({ children, className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "glass-panel shadow-lg min-h-[100px] flex flex-col justify-between p-4",
                "hover:-translate-y-1 hover:shadow-neon-cyan hover:border-bio-cyan/30 transition-all duration-300 ease-out",
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
