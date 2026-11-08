'use client';

import { useRef, useState, useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { toggleAttendance } from '@/actions/data';
import { cn } from '@/lib/utils';

export function AttendanceToggle({ sessionId, memberId, memberName, sessionLabel, isPresent, compact = false }: {
    sessionId: string; memberId: string; memberName: string; sessionLabel: string; isPresent: boolean; compact?: boolean;
}) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const inFlight = useRef(false);
    const label = `${isPresent ? 'Mark absent' : 'Mark present'}: ${memberName}, ${sessionLabel}`;
    const toggle = () => {
        if (inFlight.current) return;
        inFlight.current = true;
        setError(null);
        startTransition(async () => {
            try {
                const result = await toggleAttendance(sessionId, memberId, !isPresent);
                if (!result.success) setError(result.message);
            } catch { setError('Could not save attendance. Try again.'); }
            finally { inFlight.current = false; }
        });
    };
    return <div className="inline-flex flex-col items-start gap-1">
        <button type="button" onClick={toggle} disabled={isPending} aria-label={label}
            aria-pressed={isPresent} aria-busy={isPending}
            className={cn('inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lagoon disabled:opacity-60',
                isPresent ? 'border-emerald-500 bg-emerald-500/15 text-foreground' : 'border-border bg-surface-ocean text-foreground')}>
            {isPending ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <Check aria-hidden="true" className={cn('h-5 w-5', !isPresent && compact && 'opacity-0')} />}
            {!compact && (isPending ? 'Saving...' : isPresent ? 'Mark absent' : 'Mark present')}
        </button>
        {error && <p role="alert" className="max-w-56 text-left text-xs text-red-600 dark:text-red-300">{error} Select again to retry.</p>}
        <span role="status" className="sr-only">{isPending ? `Saving attendance for ${memberName}` : `${memberName}: ${isPresent ? 'present' : 'absent'}`}</span>
    </div>;
}
