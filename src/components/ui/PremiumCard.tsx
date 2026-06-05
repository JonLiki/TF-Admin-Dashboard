import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    /** Enable animated gradient border on hover */
    glowBorder?: boolean;
}

export function PremiumCard({ children, className, glowBorder = false, ...props }: CardProps) {
    return (
        <div className={cn("relative group h-full rounded-2xl", className)}>
            {/* Animated Glow Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-r from-tongan/20 via-lagoon/10 to-ocean-light/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />

            {/* Animated Conic-Gradient Border */}
            {glowBorder && (
                <div className="animated-border rounded-2xl">
                    <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-bio-cyan/30 via-transparent to-tongan/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />
                </div>
            )}

            {/* Card Content Shell */}
            <div
                className={cn(
                    "relative h-full flex flex-col justify-between p-5 rounded-2xl",
                    "bg-surface-ocean/80 backdrop-blur-md border border-white/10",
                    "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
                    "hover:border-lagoon/40 hover:bg-surface-ocean/90",
                    "hover:scale-[1.015] hover:-translate-y-0.5",
                    "transition-all duration-300 ease-out",
                    "text-card-foreground",
                    "overflow-hidden", // Keep internal effects contained
                    "noise-texture" // Subtle depth texture
                )}
                {...props}
            >
                {/* Subtle Inner Highlight */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none rounded-2xl" />

                {/* Shimmer Sweep on Hover */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                </div>

                {/* Content */}
                <div className="relative z-10 w-full h-full flex flex-col">
                    {children}
                </div>
            </div>
        </div>
    );
}

