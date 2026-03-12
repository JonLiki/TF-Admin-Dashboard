import { Skeleton } from '@/components/ui/Skeleton';
import { PremiumCard } from '@/components/ui/PremiumCard';

export default function WeighInLoading() {
    return (
        <div className="min-h-full pb-10">
            {/* PageHeader Skeleton */}
            <div className="py-10 px-6 md:px-10 bg-surface-deep border-b border-white/5">
                <Skeleton className="h-8 w-40 mb-2" />
                <Skeleton className="h-4 w-56" />
            </div>

            {/* Summary Cards */}
            <div className="px-6 md:px-10 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="relative p-6 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-ocean-deep/90 to-earth-dark/90">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-lagoon via-tapa to-tongan rounded-t-2xl opacity-80" />
                            <div className="flex items-center gap-3 mb-4">
                                <Skeleton className="h-12 w-12 rounded-xl" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-10 w-20 mb-2" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Member List Skeleton */}
            <div className="px-6 md:px-10 mt-6">
                <PremiumCard className="overflow-hidden p-0 border-lagoon/20">
                    <div className="p-6 border-b border-lagoon/20 bg-ocean/20">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-10 w-64 rounded-lg" />
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-xl" />
                        ))}
                    </div>
                </PremiumCard>
            </div>
        </div>
    );
}
