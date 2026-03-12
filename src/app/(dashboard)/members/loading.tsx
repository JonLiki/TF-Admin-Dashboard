import { Skeleton } from '@/components/ui/Skeleton';
import { PremiumCard } from '@/components/ui/PremiumCard';

export default function MembersLoading() {
    return (
        <div className="min-h-full pb-10">
            <div className="py-10 px-6 md:px-10 bg-surface-deep border-b border-white/5">
                <Skeleton className="h-8 w-36 mb-2" />
                <Skeleton className="h-4 w-52" />
            </div>
            <div className="px-6 md:px-10 mt-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Form skeleton */}
                <div className="hidden lg:block">
                    <PremiumCard className="p-6 bg-ocean-deep/80 border border-white/10">
                        <Skeleton className="h-6 w-28 mb-6" />
                        <div className="space-y-4">
                            <Skeleton className="h-11 w-full rounded-xl" />
                            <Skeleton className="h-11 w-full rounded-xl" />
                            <Skeleton className="h-11 w-full rounded-xl" />
                            <Skeleton className="h-11 w-full rounded-xl mt-2" />
                        </div>
                    </PremiumCard>
                </div>
                {/* Members list skeleton */}
                <div className="lg:col-span-3">
                    <div className="flex justify-between items-center mb-4">
                        <Skeleton className="h-10 w-64 rounded-lg" />
                        <Skeleton className="h-10 w-32 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-28 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
