'use client';

import { PremiumCard } from "@/components/ui/PremiumCard";
import { cn } from "@/lib/utils";
import { Medal, Scale, Heart, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { Team, TeamWeekMetric } from "@prisma/client";

interface MetricListProps {
    title: string;
    items: Array<TeamWeekMetric & { team: Team }>;
    valueKey: keyof TeamWeekMetric;
    unit: string;
    weekId: string;
    theme: 'ocean' | 'tongan' | 'lifestyle' | 'attendance';
}

export function MetricList({ title, items, valueKey, unit, weekId, theme }: MetricListProps) {
    const themeConfig = {
        ocean: {
            headerBg: "bg-ocean border-ocean-light",
            iconColor: "text-blue-200",
            accent: "text-lagoon",
            border: "hover:border-lagoon",
            glow: "hover:shadow-[0_0_15px_rgba(28,114,147,0.2)]",
            Icon: Medal
        },
        tongan: {
            headerBg: "bg-tongan-dark border-tongan",
            iconColor: "text-red-200",
            accent: "text-tongan-red",
            border: "hover:border-tongan-red",
            glow: "hover:shadow-[0_0_15px_rgba(200,16,46,0.2)]",
            Icon: Scale
        },
        lifestyle: {
            headerBg: "bg-pink-900 border-pink-700",
            iconColor: "text-pink-200",
            accent: "text-pink-500",
            border: "hover:border-pink-500",
            glow: "hover:shadow-[0_0_15px_rgba(236,72,153,0.2)]",
            Icon: Heart
        },
        attendance: {
            headerBg: "bg-green-900 border-green-700",
            iconColor: "text-green-200",
            accent: "text-green-500",
            border: "hover:border-green-500",
            glow: "hover:shadow-[0_0_15px_rgba(34,197,94,0.2)]",
            Icon: CalendarCheck
        }
    };

    const styles = themeConfig[theme];
    const Icon = styles.Icon;

    return (
        <PremiumCard className="overflow-hidden p-0 border-lagoon/20 bg-ocean-deep/80 backdrop-blur-sm flex flex-col h-full">
            {/* Header */}
            <div className={cn("p-4 border-b flex items-center space-x-3 bg-opacity-80 backdrop-blur-md", styles.headerBg)}>
                <Icon className={cn("w-5 h-5", styles.iconColor)} />
                <h3 className="font-bold text-white text-lg tracking-wide uppercase">{title}</h3>
            </div>

            {/* List */}
            <div className="flex-1 p-3 space-y-2 bg-ocean-deep/30 min-h-[300px]">
                {items.map((m, i) => (
                    <div key={m.id} className={cn(
                        "relative flex justify-between items-center p-3 rounded-lg border transition-all duration-300 ease-out group",
                        "bg-ocean/20 border-white/5 hover:-translate-y-0.5",
                        styles.border,
                        styles.glow,
                        i === 0 && "mb-4 border-lagoon/30 bg-white/5 shadow-lg" // Highlight 1st place
                    )}>
                        {/* Rank Badge */}
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-6 text-center font-bold text-xs flex items-center justify-center h-6 rounded shadow-inner",
                                i === 0
                                    ? "bg-gradient-to-br from-yellow-300/20 to-yellow-600/20 text-yellow-200 border border-yellow-500/30 scale-110 shadow-yellow-500/10"
                                    : "text-lagoon-100/50 bg-ocean-deep border border-white/5"
                            )}>
                                {i + 1}
                            </div>

                            <div className="flex flex-col">
                                <Link href={`/scoreboard/team/${m.team.id}?weekId=${weekId}`} className="group-hover:text-white transition-colors">
                                    <span className={cn(
                                        "font-bold text-sm block leading-tight transition-colors",
                                        i === 0 ? "text-white text-base" : "text-lagoon-100/80 group-hover:text-white"
                                    )}>
                                        {m.team.name}
                                    </span>
                                </Link>
                                {i === 0 && <span className="text-[10px] text-yellow-500/80 uppercase tracking-wider font-semibold">Leader</span>}
                            </div>
                        </div>

                        {/* Value */}
                        <div className="text-right">
                            <span className={cn(
                                "font-mono font-bold block leading-none",
                                i === 0 ? "text-xl text-white" : "text-sm text-lagoon-100/60",
                                i === 0 && styles.accent
                            )}>
                                {(Number(m[valueKey]) || 0).toFixed(valueKey === 'lifestyleAverage' ? 1 : 2)}
                            </span>
                            <span className="text-[10px] text-tapa uppercase font-semibold opacity-60">{unit}</span>
                        </div>
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-lagoon-100/30 text-xs uppercase tracking-widest mt-10">
                        <span>No Data</span>
                    </div>
                )}
            </div>
        </PremiumCard>
    );
}
