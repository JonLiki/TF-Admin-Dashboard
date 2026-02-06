'use client';

import { Select, SelectOption } from "@/components/ui/Select";
import { useRouter } from "next/navigation";

interface SessionSelectorProps {
    sessions: SelectOption[];
    selectedSessionId: string;
}

export function SessionSelector({ sessions, selectedSessionId }: SessionSelectorProps) {
    const router = useRouter();

    const handleSessionChange = (sessionId: string) => {
        router.push(`/attendance?sessionId=${sessionId}`);
    };

    return (
        <Select
            options={sessions}
            value={selectedSessionId}
            onChange={handleSessionChange}
            className="w-64"
        />
    );
}
