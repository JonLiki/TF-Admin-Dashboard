'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { OceanWaves, TonganNgatu } from '@/components/ui/Patterns';
import { AnimatedNumber } from '@/components/ui/MicroAnimations';

interface StatCardProps {
    label: string;
    value: string | number;
    subtext?: string;
    icon: LucideIcon;
    colorClass: string;
    borderClass?: string;
    className?: string;
    pattern?: 'waves' | 'ngatu';
    isNumber?: boolean;
    /** Enable shimmer sweep animation for high-priority or active cards */
    priority?: boolean;
}

export function StatCard({ label, value, subtext, icon: Icon, colorClass, borderClass, className, pattern, isNumber, priority = false }: StatCardProps) {
    // Contextual Pattern Logic: 
    // Waves for Physical/Movement, Ngatu for Lifestyle/Community
    const displayPattern = pattern || (label.toLowerCase().includes('km') || label.toLowerCase().includes('bench') ? 'waves' : 'ngatu');

    return (
        <PremiumCard glowBorder className={cn(
            "p-6 flex flex-col justify-between h-32 md:h-40 group relative overflow-hidden",
            priority && "shimmer-sweep",
            borderClass, 
            className
        )}>
            {/* Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-blend-overlay mix-blend-overlay">
                {displayPattern === 'ngatu' && <TonganNgatu />}
                {displayPattern === 'waves' && <OceanWaves />}
            </div>

            {/* Background Glow on Hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex justify-between items-start z-10">
                <div className="relative">
                    {/* Breathing Glow behind icon */}
                    <div className={cn("absolute inset-0 rounded-xl blur-lg breathing-glow opacity-0 group-hover:opacity-100 transition-opacity", colorClass)} />
                    <div className={cn("relative p-2.5 rounded-xl shadow-lg border border-white/10 backdrop-blur-sm overflow-hidden", colorClass, "group-hover:scale-110 transition-transform duration-300 ease-out")}>
                        <Icon className="h-5 w-5 relative z-10" />
                        <div className="absolute inset-0 bg-white/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
                {subtext && <span className="text-micro font-bold text-lagoon-100 bg-ocean-deep/50 border border-lagoon/20 px-2 py-0.5 rounded uppercase tracking-tongan group-hover:bg-lagoon group-hover:border-lagoon group-hover:text-white transition-colors shadow-inner">{subtext}</span>}
            </div>

            <div className="z-10">
                <h3 className="font-mono text-3xl font-black text-foreground tracking-tighter mt-4 group-hover:translate-x-1 transition-transform duration-300 drop-shadow-md">
                    {isNumber && typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
                </h3>
                <p className="text-micro font-bold font-display uppercase tracking-widest text-foreground/50 mt-1 group-hover:text-foreground transition-colors">{label}</p>
            </div>
        </PremiumCard>
    );
}

