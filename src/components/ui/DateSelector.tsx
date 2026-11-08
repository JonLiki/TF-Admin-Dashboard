'use client';

import { Select, SelectOption } from "@/components/ui/Select";
import { navigateWithDraftCheck } from '@/components/ui/UnsavedChangesGuard';
import { useRouter } from "next/navigation";

interface DateSelectorProps {
    dates: SelectOption[];
    selectedDate: string;
}

export function DateSelector({ dates, selectedDate }: DateSelectorProps) {
    const router = useRouter();

    const handleDateChange = (date: string) => {
        navigateWithDraftCheck(() => router.push(`/weigh-in?date=${date}`));
    };

    return (
        <Select
            label="Weigh-in date"
            options={dates}
            value={selectedDate}
            onChange={handleDateChange}
            className="w-56"
        />
    );
}
