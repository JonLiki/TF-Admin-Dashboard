import { LoadingSkeleton, StatCardSkeleton } from "./LoadingSkeleton";

export function DashboardSkeleton() {
    return (
        <div className="min-h-full pb-10">
            {/* Header Skeleton */}
            <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4 py-10 px-6 md:px-10 bg-[#0A1F2E] border-b border-white/5">
                <div className="relative z-10">
                    <LoadingSkeleton variant="text" className="w-48 h-8 mb-2" />
                    <LoadingSkeleton variant="text" className="w-32 h-4" />
                </div>
            </div>

            {/* Content */}
            <div className="px-6 md:px-10 mt-8 space-y-8">
                {/* Stat Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>

                {/* Analytics Skeleton */}
                <div className="bg-gradient-to-b from-[#111827] to-[#0B1220] rounded-2xl border border-white/5 shadow-lg p-6">
                    <LoadingSkeleton variant="text" className="w-64 h-6 mb-4" />
                    <LoadingSkeleton variant="card" className="h-64" />
                </div>
            </div>
        </div>
    );
}
