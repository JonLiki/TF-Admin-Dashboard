'use client';
import { WeekSelector } from './WeekSelector';
import type { SelectOption } from './Select';
export function SimpleWeekSelector(props: { weeks: SelectOption[]; selectedWeekId: string; basePath: string }) {
    return <WeekSelector {...props} />;
}
