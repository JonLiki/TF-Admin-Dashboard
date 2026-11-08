import { Skeleton } from '@/components/ui/Skeleton';

export default function LoadingCheckIn() {
    return <div aria-label="Loading weekly check-in" aria-busy="true" className="space-y-6 p-6 md:p-10">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{[0, 1, 2].map(index => <Skeleton key={index} className="h-24 w-full" />)}</div>
        <Skeleton className="h-96 w-full" />
    </div>;
}
