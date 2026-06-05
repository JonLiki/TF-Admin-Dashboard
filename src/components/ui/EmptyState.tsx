import { LucideIcon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { OceanWaves } from "./Patterns";
import Link from "next/link";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-12 text-center",
            "bg-gradient-to-b from-ocean-deep to-obsidian rounded-2xl border border-white/5 shadow-lg",
            "relative overflow-hidden",
            className
        )}>
            {/* Floating ocean wave behind icon */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <OceanWaves />
            </div>

            {/* Icon with Pacific-themed styling */}
            <div className="mb-6 relative">
                {/* Breathing glow ring */}
                <div className="absolute -inset-3 bg-lagoon/15 blur-2xl rounded-full breathing-glow" />
                <div className="relative bg-ocean p-6 rounded-2xl border border-white/10 shadow-xl">
                    <Icon className="h-12 w-12 text-lagoon-100" strokeWidth={1.5} />
                </div>
            </div>

            {/* Text Content */}
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                {title}
            </h3>
            <p className="text-slate-400 max-w-md mb-6 text-sm leading-relaxed">
                {description}
            </p>

            {/* Action Button with arrow bounce */}
            {actionLabel && actionHref && (
                <Link href={actionHref}>
                    <Button variant="primary" size="md" className="group/btn">
                        {actionLabel}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            )}

            {/* Decorative Element - Pacific Wave Pattern */}
            <div className="mt-8 flex items-center gap-2 opacity-20">
                <div className="h-1 w-8 bg-gradient-to-r from-lagoon to-lagoon/50 rounded-full" />
                <div className="h-1 w-4 bg-lagoon/60 rounded-full" />
                <div className="h-1 w-2 bg-lagoon/40 rounded-full" />
            </div>
        </div>
    );
}

