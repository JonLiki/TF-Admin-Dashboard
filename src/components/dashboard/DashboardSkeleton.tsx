import { PremiumCard } from '@/components/ui/PremiumCard';
import { Skeleton } from '@/components/ui/Skeleton';

export function DashboardSkeleton() {
    return (
        <div className="px-6 md:px-10 space-y-8 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-min">
                {/* 1. HERO METRIC: Current Week (Top Left) */}
                <div className="col-span-1">
                    <PremiumCard className="p-6 flex flex-col justify-between h-32 md:h-40 border-white/5">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-10 w-10 rounded-xl" />
                            <Skeleton className="h-5 w-16 rounded" />
                        </div>
                        <div>
                            <Skeleton className="h-8 w-24 mb-2" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </PremiumCard>
                </div>

                {/* 2. HERO METRIC: Total Loss (Top Mid) */}
                <div className="col-span-1 sm:col-span-2 md:col-span-2">
                    <PremiumCard className="p-6 flex flex-col justify-between h-32 md:h-40 border-tongan/20 bg-tongan/5">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-10 w-10 rounded-xl bg-tongan/20" />
                            <Skeleton className="h-5 w-16 rounded bg-tongan/20" />
                        </div>
                        <div>
                            <Skeleton className="h-8 w-32 mb-2 bg-tongan/20" />
                            <Skeleton className="h-3 w-40 bg-tongan/20" />
                        </div>
                    </PremiumCard>
                </div>

                {/* 3. HERO METRIC: Active Teams (Top Right) */}
                <div className="col-span-1">
                    <PremiumCard className="p-6 flex flex-col justify-between h-32 md:h-40 border-white/5">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-10 w-10 rounded-xl" />
                        </div>
                        <div>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </PremiumCard>
                </div>

                {/* 4. MAIN CHART (Middle Left) */}
                <div className="col-span-1 sm:col-span-2 md:col-span-3 md:row-span-2 min-h-[500px]">
                    <PremiumCard className="p-0 overflow-hidden h-full border-white/5">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-20 rounded-md" />
                                <Skeleton className="h-8 w-20 rounded-md" />
                            </div>
                        </div>
                        <div className="p-6 h-full flex flex-col justify-end pb-20 space-y-4">
                            <div className="flex items-end justify-between h-64 gap-2">
                                {[...Array(8)].map((_, i) => (
                                    <Skeleton key={i} className="w-full rounded-t-lg" style={{ height: `${(i * 10) % 80 + 20}%` }} />
                                ))}
                            </div>
                            <div className="space-y-2 pt-4">
                                <Skeleton className="h-12 w-full rounded-lg" />
                                <Skeleton className="h-12 w-full rounded-lg" />
                                <Skeleton className="h-12 w-full rounded-lg" />
                            </div>
                        </div>
                    </PremiumCard>
                </div>

                {/* 5. LEADERBOARD (Middle Right) */}
                <div className="col-span-1 sm:col-span-2 md:col-span-1 md:row-span-2 flex flex-col h-full gap-4">
                    <div className="flex justify-between items-center mb-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                    <Skeleton className="h-12 w-full rounded-lg mt-auto" />
                </div>
            </div>
        </div>
    );
}
