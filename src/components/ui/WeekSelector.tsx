'use client';

import { useRouter } from 'next/navigation';
import { Select, type SelectOption } from './Select';
import { Button } from './Button';
import { navigateWithDraftCheck } from './UnsavedChangesGuard';

interface WeekSelectorProps { weeks: SelectOption[]; selectedWeekId: string; basePath: string }
export function WeekSelector({ weeks, selectedWeekId, basePath }: WeekSelectorProps) {
    const router = useRouter();
    const index = weeks.findIndex(week => week.value === selectedWeekId);
    const go = (id: string) => navigateWithDraftCheck(() => {
        const params = new URLSearchParams(window.location.search);
        params.set('weekId', id);
        router.push(`${basePath}?${params}`);
    });
    return <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <Button type="button" variant="secondary" disabled={index <= 0} onClick={() => go(weeks[index - 1].value)} aria-label="Previous week">Previous</Button>
        <Select label="Training week" options={weeks} value={selectedWeekId} onChange={go} className="min-w-40 flex-1" />
        <Button type="button" variant="secondary" disabled={index < 0 || index >= weeks.length - 1} onClick={() => go(weeks[index + 1].value)} aria-label="Next week">Next</Button>
    </div>;
}
