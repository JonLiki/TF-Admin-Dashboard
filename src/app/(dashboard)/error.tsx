'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-red-500/10 p-4">
                <AlertTriangle className="h-10 w-10 text-tongan-red" />
            </div>
            <h2 className="text-xl font-bold text-white">Something went wrong!</h2>
            <p className="text-slate-400 max-w-md">
                We encountered an unexpected error. Please try again or contact support if the issue persists.
            </p>
            <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                    Go Home
                </Button>
                <Button variant="primary" onClick={() => reset()}>
                    Try Again
                </Button>
            </div>
        </div>
    );
}
