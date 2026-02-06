import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <div className={cn(
            "relative p-6 rounded-2xl border-2 transition-all duration-300",
            // Much stronger background with gradient
            "bg-gradient-to-br from-ocean-deep/90 to-earth-dark/90",
            // Prominent border with glow effect
            "border-white/10 hover:border-lagoon hover:shadow-2xl hover:shadow-lagoon/20",
            "backdrop-blur-md",
            // Add subtle animation on hover
            "hover:scale-[1.02] hover:-translate-y-1",
            className
        )}>
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-lagoon via-tapa to-tongan rounded-t-2xl opacity-80" />

            <div className="flex flex-col gap-4">
                {/* Icon and Label Row */}
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-3 rounded-xl shadow-lg",
                        "ring-2 ring-white/10",
                        iconBg
                    )}>
                        <Icon className={cn("w-6 h-6", iconColor)} />
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
                            "text-lg font-bold",
                            trend === "up" && "text-green-400",
                            trend === "down" && "text-red-400",
                            trend === "neutral" && "text-slate-400"
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
        </div>
    );
}
