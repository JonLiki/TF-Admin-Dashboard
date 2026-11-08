'use client';
import { WeekSelector as SharedWeekSelector } from '@/components/ui/WeekSelector';
import type { SelectOption } from '@/components/ui/Select';
export function WeekSelector(props: { weeks: SelectOption[]; selectedWeekId: string }) {
    return <SharedWeekSelector {...props} basePath="/attendance" />;
}
