'use client';

import { Select, SelectOption } from "@/components/ui/Select";
import { useRouter } from "next/navigation";

interface WeekSelectorProps {
    weeks: SelectOption[];
    selectedWeekId: string;
}

export function WeekSelector({ weeks, selectedWeekId }: WeekSelectorProps) {
    const router = useRouter();

    const handleWeekChange = (weekId: string) => {
        router.push(`/attendance?weekId=${weekId}`);
    };

    return (
        <Select
            options={weeks}
            value={selectedWeekId}
            onChange={handleWeekChange}
            className="w-64"
        />
    );
}
