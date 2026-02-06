
import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Trophy, Flame, Footprints, Activity } from 'lucide-react';
import { NgatuDivider, WinnerBadge } from '@/components/ui/Patterns';

interface WinnerCardProps {
    teamName: string;
    category: 'WEIGHT_LOSS' | 'KM_AVG' | 'LIFESTYLE_AVG' | 'ATTENDANCE_AVG';
    weekNumber: number;
    className?: string;
}

const CATEGORY_CONFIG = {
    WEIGHT_LOSS: {
        label: 'Weight Loss Champion',
        icon: Flame,
        color: 'text-tongan',
        bg: 'bg-tongan/10',
        border: 'border-tongan/20',
        gradient: 'from-tongan/20 to-tongan/5',
        shadow: 'shadow-tongan/10'
    },
    KM_AVG: {
        label: 'Distance Leader',
        icon: Footprints,
        color: 'text-lagoon',
        bg: 'bg-lagoon/10',
        border: 'border-lagoon/20',
        gradient: 'from-lagoon/20 to-lagoon/5',
        shadow: 'shadow-lagoon/10'
    },
    LIFESTYLE_AVG: {
        label: 'Lifestyle Guru',
        icon: Activity,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        gradient: 'from-green-500/20 to-green-500/5',
        shadow: 'shadow-green-500/10'
    },
    ATTENDANCE_AVG: {
        label: 'Attendance Star',
        icon: Trophy,
        color: 'text-sand',
        bg: 'bg-sand/10',
        border: 'border-sand/20',
        gradient: 'from-sand/20 to-sand/5',
        shadow: 'shadow-sand/10'
    }
};

export function WinnerCard({ teamName, category, weekNumber, className }: WinnerCardProps) {
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.WEIGHT_LOSS;
    const Icon = config.icon;

    return (
        <div className={cn(
            "relative overflow-hidden rounded-xl border p-6 transition-all duration-300 group",
            "hover:-translate-y-1 hover:shadow-lg backdrop-blur-md bg-ocean-deep/80",
            config.border,
            config.shadow,
            className
        )}>
            {/* Background Gradient */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-100 transition-opacity",
                config.gradient
            )} />

            {/* Decorative Patterns */}
            <NgatuDivider className={cn("absolute top-0 left-0 w-full h-1 opacity-20", config.color)} />
            <div className="absolute -right-6 -bottom-6 opacity-5 rotate-12 transform group-hover:scale-110 transition-transform duration-500">
                <Icon className={cn("w-32 h-32", config.color)} />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="flex items-start justify-between">
                    <div className={cn("p-3 rounded-lg border border-white/5 shadow-inner", config.bg)}>
                        <Icon className={cn("w-6 h-6", config.color)} />
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-tapa opacity-80">Week {weekNumber}</span>
                        <span className={cn("text-xs font-bold uppercase tracking-wide", config.color)}>IKUNA</span>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-1">{config.label}</h3>
                    <p className="text-2xl font-black text-white leading-none tracking-tight break-words">{teamName}</p>
                </div>
            </div>

            {/* Glow Effect */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
                "bg-gradient-to-tr from-transparent via-white/5 to-transparent"
            )} />
        </div>
    );
}
