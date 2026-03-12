import { Skeleton } from '@/components/ui/Skeleton';
import { PremiumCard } from '@/components/ui/PremiumCard';

export default function AttendanceLoading() {
    return (
        <div className="min-h-full pb-10">
            <div className="py-10 px-6 md:px-10 bg-surface-deep border-b border-white/5">
                <Skeleton className="h-8 w-44 mb-2" />
                <Skeleton className="h-4 w-56" />
            </div>
            <div className="px-6 md:px-10 mt-6">
                <PremiumCard className="overflow-hidden p-0 border-lagoon/20">
                    <div className="p-6 border-b border-lagoon/20 bg-ocean/20">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-10 w-48 rounded-lg" />
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        {[...Array(10)].map((_, i) => (
                            <Skeleton key={i} className="h-14 w-full rounded-xl" />
                        ))}
                    </div>
                </PremiumCard>
            </div>
        </div>
    );
}
