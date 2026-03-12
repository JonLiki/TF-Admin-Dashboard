import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function PremiumCard({ children, className, ...props }: CardProps) {
    return (
        <div className={cn("relative group h-full", className)}>
            {/* Animated Glow Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-r from-tongan/20 via-lagoon/10 to-ocean-light/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />

            {/* Card Content Shell */}
            <div
                className={cn(
                    "relative h-full flex flex-col justify-between p-5 rounded-2xl",
                    "bg-surface-ocean/80 backdrop-blur-md border border-white/10",
                    "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
                    "hover:border-lagoon/40 hover:bg-surface-ocean/90",
                    "transition-all duration-300 ease-out",
                    "text-card-foreground",
                    "overflow-hidden" // Keep internal effects contained
                )}
                {...props}
            >
                {/* Subtle Inner Highlight */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none rounded-2xl" />

                {/* Content */}
                <div className="relative z-10 w-full h-full flex flex-col">
                    {children}
                </div>
            </div>
        </div>
    );
}
