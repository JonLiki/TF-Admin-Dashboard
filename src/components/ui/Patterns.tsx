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
            <span className="absolute -bottom-6 text-micro font-bold tracking-[0.2em] text-tongan">IKUNA</span>
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

const KUPESI_TILE = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="12" viewBox="0 0 20 12">' +
    '<path d="M5 0L10 6L5 12L0 6Z" fill="#C8102E"/>' +
    '<path d="M15 0L20 6L15 12L10 6Z" fill="none" stroke="#C8102E" stroke-width="1.25"/>' +
    '</svg>'
)}`;

export function KupesiBand({ className }: { className?: string }) {
    // Kupesi (tapa diamond) band — the signature To'a Fatalona page motif: a row of
    // alternating solid/outline lozenges in Tongan red (#C8102E, identical in both
    // themes). Rendered as a repeating background so it reliably fills the width.
    return (
        <div
            className={cn("h-3 w-full bg-repeat-x", className)}
            style={{ backgroundImage: `url("${KUPESI_TILE}")`, backgroundSize: 'auto 100%' }}
            aria-hidden="true"
        />
    );
}
