export default function Loading() {
    return (
        <div className="fixed inset-0 min-h-screen flex flex-col items-center justify-center p-6 bg-ocean-deep/95 backdrop-blur-md z-50">
            {/* Progress accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-transparent via-lagoon to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
            </div>

            <div className="relative flex items-center justify-center">
                {/* Outer pulsing glow */}
                <div className="absolute w-32 h-32 rounded-full bg-tongan/15 blur-2xl breathing-glow" />
                
                {/* Orbiting dots ring */}
                <div className="absolute w-24 h-24 animate-[spin_4s_linear_infinite]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-lagoon shadow-[0_0_8px_rgba(102,252,241,0.6)]" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-lagoon/60" />
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1 h-1 rounded-full bg-lagoon/40" />
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-tongan/50" />
                </div>

                {/* Outer Ring */}
                <div className="w-20 h-20 rounded-full border-2 border-ocean border-t-tongan animate-spin" />
                
                {/* Inner Ring (counter-spin) */}
                <div className="absolute w-16 h-16 rounded-full border-2 border-transparent border-t-lagoon/40 animate-[spin_2s_linear_infinite_reverse]" />

                {/* TF Logo Center */}
                <div className="absolute flex items-center justify-center">
                    <span className="text-xl font-black text-gradient drop-shadow-md">TF</span>
                </div>
            </div>
            
            <h3 className="mt-10 text-xl font-bold font-display text-white tracking-widest uppercase animate-pulse">
                Loading...
            </h3>
            <p className="mt-2 text-lagoon-100/50 text-sm animate-pulse delay-150">
                Teuteu ki he tau — Prepare for battle
            </p>
        </div>
    );
}

