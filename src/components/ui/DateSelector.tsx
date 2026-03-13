'use client';

import { Select, SelectOption } from "@/components/ui/Select";
import { useRouter } from "next/navigation";

interface DateSelectorProps {
    dates: SelectOption[];
    selectedDate: string;
}

export function DateSelector({ dates, selectedDate }: DateSelectorProps) {
    const router = useRouter();

    const handleDateChange = (date: string) => {
        router.push(`/weigh-in?date=${date}`);
    };

    return (
        <Select
            options={dates}
            value={selectedDate}
            onChange={handleDateChange}
            className="w-56"
        />
    );
}
