'use client';

import { useState, useTransition } from 'react';
import { PremiumCard } from "@/components/ui/PremiumCard";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/lib/utils";
import { toggleAttendance } from "@/actions/data";
import { format } from "date-fns";
import { ImportButton } from "@/components/ui/ImportButton";
import { CalendarCheck, Filter, Loader2, Check } from "lucide-react";

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    team: {
        name: string;
    } | null;
}

interface AttendanceRecord {
    memberId: string;
    isPresent: boolean;
}

interface SessionWithAttendance {
    id: string;
    date: Date;
    type: string;
    attendance: AttendanceRecord[];
}

interface WeeklyAttendanceTableProps {
    members: Member[];
    sessions: SessionWithAttendance[];
    weekLabel: string;
}

export function WeeklyAttendanceTable({ members, sessions, weekLabel }: WeeklyAttendanceTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isPending, startTransition] = useTransition();

    const filteredMembers = members.filter(member =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.team?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const hasResults = filteredMembers.length > 0;

    // Fast lookup for attendance status Map<SessionId, Set<MemberId>>
    const attendanceMaps = new Map<string, Set<string>>();
    sessions.forEach(session => {
        const presentMembers = new Set(session.attendance.filter(a => a.isPresent).map(a => a.memberId));
        attendanceMaps.set(session.id, presentMembers);
    });

    const handleToggle = (sessionId: string, memberId: string, currentlyPresent: boolean) => {
        startTransition(() => {
            toggleAttendance(sessionId, memberId, !currentlyPresent);
        });
    };

    return (
        <PremiumCard className="overflow-hidden p-0 border-lagoon/20 bg-ocean-deep/80 backdrop-blur-sm flex flex-col h-[calc(100vh-16rem)]">
            <div className="p-4 md:p-6 border-b border-lagoon/20 space-y-4 bg-ocean/20 backdrop-blur-md shrink-0">
                <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-lagoon/10 rounded-lg">
                            <CalendarCheck className="w-5 h-5 text-lagoon-100" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{weekLabel}</h2>
                            <p className="text-xs text-lagoon-100/60 font-medium uppercase tracking-wider">{sessions.length} Sessions Logged</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <ImportButton type="attendance" />
                        <SearchInput
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search members..."
                            className="w-full md:w-64 bg-ocean-deep/50 border-lagoon/30 text-lagoon-100 placeholder:text-lagoon-100/50 focus:border-lagoon/60 focus:ring-lagoon/20"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-ocean-deep/30 relative">
                {isPending && (
                    <div className="absolute inset-0 z-50 bg-ocean-deep/40 backdrop-blur-[1px] flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-lagoon-100 animate-spin" />
                    </div>
                )}
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="sticky top-0 z-20 bg-ocean-deep/95 backdrop-blur-md shadow-md border-b border-lagoon/30">
                        <tr>
                            <th className="p-4 text-xs font-bold text-lagoon-100/70 uppercase tracking-widest whitespace-nowrap">Member</th>
                            <th className="p-4 text-xs font-bold text-lagoon-100/70 uppercase tracking-widest whitespace-nowrap">Group</th>
                            {sessions.map(session => (
                                <th key={session.id} className="p-4 text-center text-xs font-bold text-lagoon-100 uppercase tracking-widest min-w-[120px]">
                                    <div className="flex flex-col items-center">
                                        <span className="text-white font-extrabold">{session.type}</span>
                                        <span className="text-[10px] text-lagoon-100/50">{format(new Date(session.date), 'MMM d')}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-lagoon/10">
                        {filteredMembers.map((member) => (
                            <tr key={member.id} className="hover:bg-ocean/20 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-ocean-deep border border-white/5 flex items-center justify-center text-xs font-bold text-lagoon-100/50 shadow-inner group-hover:border-lagoon/30 group-hover:text-lagoon-100 transition-colors">
                                            {member.firstName[0]}{member.lastName[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-white group-hover:text-lagoon-100 transition-colors">
                                                {member.firstName} {member.lastName}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={cn(
                                        "text-xs font-medium",
                                        member.team ? "text-lagoon-100/80" : "text-lagoon-100/40 italic"
                                    )}>
                                        {member.team?.name || 'Unassigned'}
                                    </span>
                                </td>
                                {sessions.map(session => {
                                    const sessionMap = attendanceMaps.get(session.id);
                                    const isPresent = sessionMap?.has(member.id) ?? false;

                                    return (
                                        <td key={session.id} className="p-4 text-center align-middle">
                                            <button
                                                onClick={() => handleToggle(session.id, member.id, isPresent)}
                                                disabled={isPending}
                                                className={cn(
                                                    "inline-flex items-center justify-center w-8 h-8 rounded-md border-2 transition-all duration-200 outline-none focus:ring-2 focus:ring-lagoon-100/50 focus:ring-offset-2 focus:ring-offset-ocean-deep disabled:opacity-50 disabled:cursor-not-allowed",
                                                    isPresent
                                                        ? "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                                                        : "bg-ocean-deep border-lagoon/30 text-transparent hover:border-lagoon/70 hover:bg-ocean"
                                                )}
                                                aria-label={isPresent ? "Mark absent" : "Mark present"}
                                            >
                                                <Check className={cn("w-5 h-5 transition-transform", isPresent ? "scale-100" : "scale-0")} strokeWidth={3} />
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}

                        {!hasResults && (
                            <tr>
                                <td colSpan={2 + sessions.length} className="p-12 text-center text-lagoon-100/40">
                                    <div className="flex flex-col items-center justify-center">
                                        <Filter className="w-8 h-8 opacity-20 mb-2" />
                                        <p>No members found matching your search</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-lagoon/20 bg-ocean-deep/90 text-xs text-lagoon-100/60 flex justify-between items-center shrink-0">
                <span>Showing {filteredMembers.length} members</span>
                <span>Tap checkbox to instantly toggle attendance</span>
            </div>
        </PremiumCard>
    );
}
