import { cn } from "@/lib/utils";

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-xl bg-ocean/30 shimmer-sweep relative overflow-hidden",
                className
            )}
            {...props}
        />
    );
}

export { Skeleton };

