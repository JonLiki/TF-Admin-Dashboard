export default function Loading() {
    return (
        <div className="fixed inset-0 min-h-screen flex flex-col items-center justify-center p-6 bg-ocean-deep/90 backdrop-blur-sm z-50">
            <div className="relative">
                {/* Outer Ring */}
                <div className="w-16 h-16 rounded-full border-4 border-ocean border-t-tongan-red animate-spin" />
                
                {/* Inner Ring */}
                <div className="absolute top-1 left-1 w-14 h-14 rounded-full border-4 border-transparent border-t-lagoon/50 animate-spin-slow opacity-80" />
            </div>
            
            <h3 className="mt-8 text-xl font-bold font-display text-white tracking-widest uppercase animate-pulse">
                Loading...
            </h3>
            <p className="mt-2 text-lagoon-100/50 text-sm animate-pulse delay-150">
                Lacing up the gloves
            </p>
        </div>
    );
}
