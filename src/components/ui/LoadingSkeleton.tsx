import { cn } from "@/lib/utils";

export function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-white/10 relative overflow-hidden",
                className
            )}
            {...props}
        >
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
    );
}

export function DashboardLoadingSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex justify-between items-end mb-8">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[250px] bg-white/20" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass-panel p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                        <Skeleton className="h-8 w-24 mt-4" />
                        <Skeleton className="h-3 w-32 mt-2" />
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl h-[400px]">
                    <Skeleton className="h-6 w-40 mb-6" />
                    <Skeleton className="h-full w-full rounded-xl" />
                </div>
                <div className="glass-panel p-6 rounded-2xl h-[400px]">
                    <Skeleton className="h-6 w-32 mb-6" />
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TableLoadingSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
            <div className="border-b border-white/10 p-4">
                <div className="flex gap-4">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-6 w-1/4" />
                </div>
            </div>
            <div className="p-4 space-y-4">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                        <Skeleton className="h-8 w-1/4 rounded-lg" />
                        <Skeleton className="h-8 w-1/4 rounded-lg" />
                        <Skeleton className="h-8 w-1/4 rounded-lg" />
                        <Skeleton className="h-8 w-1/4 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}
