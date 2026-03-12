import { Skeleton } from '@/components/ui/Skeleton';
import { PremiumCard } from '@/components/ui/PremiumCard';

export default function SummaryLoading() {
    return (
        <div className="min-h-full pb-10">
            <div className="py-10 px-6 md:px-10 bg-surface-deep border-b border-white/5">
                <Skeleton className="h-8 w-36 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>
            <div className="px-6 md:px-10 mt-6">
                <PremiumCard className="overflow-hidden p-0">
                    {/* Tabs skeleton */}
                    <div className="p-6 border-b border-white/5 flex gap-2">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-28 rounded-lg" />
                        ))}
                    </div>
                    {/* Table skeleton */}
                    <div className="p-6 space-y-3">
                        <Skeleton className="h-10 w-full rounded-lg" />
                        {[...Array(12)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                    </div>
                </PremiumCard>
            </div>
        </div>
    );
}
