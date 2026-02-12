'use client';

import { useTransition } from 'react';
import { Button } from './Components';
import { Calculator, Loader2 } from 'lucide-react';

interface FinalizeWeekButtonProps {
    weekId: string;
    onFinalize: (weekId: string) => Promise<void>;
}

export function FinalizeWeekButton({ weekId, onFinalize }: FinalizeWeekButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            await onFinalize(weekId);
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Button
                type="submit"
                disabled={isPending}
                className="bg-ocean hover:bg-ocean-deep text-white shadow-lg shadow-ocean/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Finalizing...
                    </>
                ) : (
                    <>
                        <Calculator className="w-4 h-4 mr-2" />
                        Finalize Week
                    </>
                )}
            </Button>
        </form>
    );
}
