'use client';

import { Select, SelectOption } from "@/components/ui/Select";
import { useRouter } from "next/navigation";

interface WeekSelectorProps {
    weeks: SelectOption[];
    selectedWeekId: string;
    basePath: string; // e.g., "/km" or "/lifestyle"
}

export function WeekSelector({ weeks, selectedWeekId, basePath }: WeekSelectorProps) {
    const router = useRouter();

    const handleWeekChange = (weekId: string) => {
        router.push(`${basePath}?weekId=${weekId}`);
    };

    return (
        <Select
            options={weeks}
            value={selectedWeekId}
            onChange={handleWeekChange}
            className="w-40"
        />
    );
}
