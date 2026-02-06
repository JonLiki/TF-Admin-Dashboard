import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Components";
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
            "bg-gradient-to-b from-[#111827] to-[#0B1220] rounded-2xl border border-white/5 shadow-lg",
            className
        )}>
            {/* Icon with Pacific-themed styling */}
            <div className="mb-6 relative">
                <div className="absolute inset-0 bg-lagoon/20 blur-2xl rounded-full" />
                <div className="relative bg-[#0B3C5D] p-6 rounded-2xl border border-white/10 shadow-xl">
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

            {/* Action Button */}
            {actionLabel && actionHref && (
                <Link href={actionHref}>
                    <Button variant="primary" size="md">
                        {actionLabel}
                    </Button>
                </Link>
            )}

            {/* Decorative Element - Pacific Wave Pattern */}
            <div className="mt-8 flex items-center gap-2 opacity-20">
                <div className="h-1 w-8 bg-lagoon rounded-full" />
                <div className="h-1 w-4 bg-lagoon rounded-full" />
                <div className="h-1 w-2 bg-lagoon rounded-full" />
            </div>
        </div>
    );
}
