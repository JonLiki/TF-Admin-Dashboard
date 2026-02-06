import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
    className?: string;
    variant?: 'card' | 'text' | 'circle' | 'stat';
}

export function LoadingSkeleton({ className, variant = 'card' }: LoadingSkeletonProps) {
    const variants = {
        card: "h-32 w-full rounded-2xl",
        text: "h-4 w-full rounded",
        circle: "h-12 w-12 rounded-full",
        stat: "h-24 w-full rounded-2xl"
    };

    return (
        <div
            className={cn(
                "animate-pulse bg-white/5",
                variants[variant],
                className
            )}
        />
    );
}

export function StatCardSkeleton() {
    return (
        <div className="bg-gradient-to-b from-[#111827] to-[#0B1220] rounded-2xl border border-white/5 shadow-lg p-6 flex items-start space-x-4">
            <LoadingSkeleton variant="circle" className="self-center" />
            <div className="flex-1 space-y-3">
                <LoadingSkeleton variant="text" className="w-20 h-8" />
                <LoadingSkeleton variant="text" className="w-32 h-4" />
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <LoadingSkeleton key={i} variant="text" className="h-12" />
            ))}
        </div>
    );
}

export function LeaderboardSkeleton({ items = 3 }: { items?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="bg-gradient-to-b from-[#111827] to-[#0B1220] rounded-2xl border border-white/5 shadow-lg p-5 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <LoadingSkeleton variant="circle" className="h-8 w-8" />
                        <LoadingSkeleton variant="text" className="w-32 h-4" />
                    </div>
                    <LoadingSkeleton variant="text" className="w-20 h-6" />
                </div>
            ))}
        </div>
    );
}
