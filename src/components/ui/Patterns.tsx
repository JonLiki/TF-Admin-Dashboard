import React from 'react';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface PatternProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    opacity?: number;
}

export function NgatuDivider({ className, opacity = 0.05, ...props }: PatternProps) {
    return (
        <div
            className={cn("w-full h-2 bg-contain bg-repeat-x", className)}
            style={{
                backgroundImage: `url('/patterns/ngatu-divider.svg')`,
                opacity: opacity
            }}
            {...props}
        />
    );
}

export function LalavaKnot({ className, opacity = 0.08, ...props }: PatternProps) {
    return (
        <div
            className={cn("w-6 h-6 bg-contain bg-no-repeat", className)}
            style={{
                backgroundImage: `url('/patterns/lalava-knot.svg')`,
                opacity: opacity
            }}
            {...props}
        />
    );
}

export function OceanWaves({ className, opacity = 0.02, ...props }: PatternProps) {
    return (
        <div
            className={cn("w-full h-full bg-repeat", className)}
            style={{
                backgroundImage: `url('/patterns/ocean-waves.svg')`,
                backgroundSize: '120px',
                opacity: opacity
            }}
            {...props}
        />
    );
}

export function WinnerBadge({ className, ...props }: PatternProps) {
    return (
        <div className={cn("relative flex items-center justify-center w-16 h-16", className)} {...props}>
            <div
                className="absolute inset-0 bg-contain bg-no-repeat bg-center animate-spin-slow"
                style={{ backgroundImage: `url('/patterns/toa-badge-ring.svg')` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-tongan drop-shadow-md" />
            </div>
            <span className="absolute -bottom-6 text-[10px] font-bold tracking-[0.2em] text-tongan">IKUNA</span>
        </div>
    );
}

export function TonganNgatu({ className, opacity = 0.05, ...props }: PatternProps) {
    return (
        <div
            className={cn("w-full h-full bg-repeat", className)}
            style={{
                backgroundImage: `url('/patterns/tongan-ngatu.svg')`,
                backgroundSize: '80px', // Adjust size for visibility
                opacity: opacity
            }}
            {...props}
        />
    );
}
