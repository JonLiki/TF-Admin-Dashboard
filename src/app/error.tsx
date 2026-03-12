'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Error Boundary caught:", error);
    }, [error]);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
            <div className="max-w-md w-full bg-ocean-deep/80 backdrop-blur-md rounded-2xl shadow-2xl border border-lagoon/20 overflow-hidden relative">
                {/* Visual Accent */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

                <div className="p-8 pb-10">
                    <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>

                    <h2 className="text-2xl font-bold font-display text-white mb-3">Something went wrong!</h2>

                    <p className="text-lagoon-100/60 mb-8 max-w-sm mx-auto">
                        We encountered an unexpected error processing your request. Please try again or return to the dashboard.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            onClick={() => reset()}
                            variant="primary"
                            className="bg-red-500 text-white hover:bg-red-600 shadow-[var(--shadow-lg)] hover:shadow-red-500/30 border-red-500 w-full sm:w-auto"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                        <Link href="/" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full">
                                <Home className="w-4 h-4 mr-2" />
                                Go Home
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Technical Context (Optional, hide in prod usually) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="p-4 bg-black/40 border-t border-white/5 text-left overflow-auto">
                        <p className="text-xs font-mono text-red-400 font-bold mb-1">Error Details:</p>
                        <p className="text-[10px] font-mono text-lagoon-100/40 break-all">
                            {error.message || "Unknown Application Error"}
                        </p>
                        {error.digest && (
                            <p className="text-[10px] font-mono text-lagoon-100/40 mt-1 mt-1 break-all">
                                Digest: {error.digest}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
