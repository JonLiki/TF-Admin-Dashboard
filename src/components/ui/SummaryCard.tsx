import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumCard } from "./PremiumCard";

interface SummaryCardProps {
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
    label: string;
    value: string | number;
    subtitle?: string;
    trend?: "up" | "down" | "neutral";
    className?: string;
}

export function SummaryCard({
    icon: Icon,
    iconColor,
    iconBg,
    label,
    value,
    subtitle,
    trend,
    className
}: SummaryCardProps) {
    return (
        <PremiumCard glowBorder className={cn("shimmer-sweep", className)}>
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-lagoon via-tapa to-tongan rounded-t-2xl opacity-80 z-20" />

            <div className="flex flex-col gap-4 p-6 relative z-10">
                {/* Icon and Label Row */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {/* Breathing glow behind icon */}
                        <div className={cn("absolute inset-0 rounded-xl blur-lg breathing-glow opacity-50", iconBg)} />
                        <div className={cn(
                            "relative p-3 rounded-xl shadow-lg",
                            "ring-2 ring-white/10",
                            iconBg
                        )}>
                            <Icon className={cn("w-6 h-6", iconColor)} />
                        </div>
                    </div>
                    <p className="text-sm font-bold uppercase text-tapa-cream tracking-wider">
                        {label}
                    </p>
                </div>

                {/* Value Row */}
                <div className="flex items-baseline gap-3">
                    <p className="text-4xl font-black text-offwhite font-mono tracking-tight">
                        {value}
                    </p>
                    {trend && (
                        <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-sm font-bold border",
                            trend === "up" && "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                            trend === "down" && "text-red-400 bg-red-500/10 border-red-500/20",
                            trend === "neutral" && "text-slate-400 bg-slate-500/10 border-slate-500/20"
                        )}>
                            {trend === "up" && "↑"}
                            {trend === "down" && "↓"}
                            {trend === "neutral" && "→"}
                        </span>
                    )}
                </div>

                {/* Subtitle */}
                {subtitle && (
                    <p className="text-sm text-tapa font-semibold">{subtitle}</p>
                )}
            </div>
        </PremiumCard>
    );
}

