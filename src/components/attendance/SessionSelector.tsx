'use client';

import { Select, SelectOption } from "@/components/ui/Select";
import { navigateWithDraftCheck } from '@/components/ui/UnsavedChangesGuard';
import { useRouter } from "next/navigation";

interface SessionSelectorProps {
    sessions: SelectOption[];
    selectedSessionId: string;
}

export function SessionSelector({ sessions, selectedSessionId }: SessionSelectorProps) {
    const router = useRouter();

    const handleSessionChange = (sessionId: string) => {
        navigateWithDraftCheck(() => router.push(`/attendance?sessionId=${sessionId}`));
    };

    return (
        <Select
            label="Attendance session"
            options={sessions}
            value={selectedSessionId}
            onChange={handleSessionChange}
            className="w-64"
        />
    );
}
