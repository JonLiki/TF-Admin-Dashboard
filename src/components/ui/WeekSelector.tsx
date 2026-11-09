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
    return <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
        <Button type="button" variant="secondary" disabled={index <= 0} onClick={() => go(weeks[index - 1].value)} aria-label="Previous week">Previous</Button>
        <Select label="Training week" options={weeks} value={selectedWeekId} onChange={go} className="order-first col-span-2 min-w-0 sm:order-none sm:min-w-40 sm:flex-1" />
        <Button type="button" variant="secondary" disabled={index < 0 || index >= weeks.length - 1} onClick={() => go(weeks[index + 1].value)} aria-label="Next week">Next</Button>
    </div>;
}
