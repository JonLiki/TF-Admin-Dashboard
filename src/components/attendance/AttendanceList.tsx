'use client';

import { useState } from 'react';
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Button } from "@/components/ui/Components";
import { CalendarCheck, Check, X, Filter, UserCheck, UserX } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/lib/utils";
import { toggleAttendance } from "@/actions/data";
import { format } from "date-fns";

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    team: {
        name: string;
    } | null;
}

interface Session {
    id: string;
    type: string;
    date: Date;
}

interface AttendanceListProps {
    members: Member[];
    session: Session;
    attendanceMap: Set<string>;
}

export function AttendanceList({ members, session, attendanceMap }: AttendanceListProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMembers = members.filter(member =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.team?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const hasResults = filteredMembers.length > 0;
    const presentCount = Array.from(attendanceMap).length;

    return (
        <PremiumCard className="overflow-hidden p-0 border-lagoon/20 bg-ocean-deep/80 backdrop-blur-sm">
            <div className="p-6 border-b border-lagoon/20 space-y-4 bg-ocean/20 backdrop-blur-md">
                <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-lagoon/10 rounded-lg">
                            <CalendarCheck className="w-5 h-5 text-lagoon-100" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{session.type} Session</h2>
                            <p className="text-xs text-lagoon-100/60 font-medium uppercase tracking-wider">{format(session.date, 'MMMM d, yyyy')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="hidden md:block text-right mr-2">
                            <div className="text-2xl font-black text-white leading-none">{presentCount}</div>
                            <div className="text-[10px] uppercase font-bold text-lagoon-100/60">Present</div>
                        </div>
                        <SearchInput
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search members..."
                            className="w-full md:w-64 bg-ocean-deep/50 border-lagoon/30 text-lagoon-100 placeholder:text-lagoon-100/50 focus:border-lagoon/60 focus:ring-lagoon/20"
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-3 bg-ocean-deep/30 min-h-[400px]">
                {/* Headers */}
                <div className="hidden md:flex px-6 py-2 text-xs font-bold text-lagoon-100/50 uppercase tracking-widest opacity-80">
                    <div className="w-1/3">Member</div>
                    <div className="w-1/4">Group</div>
                    <div className="w-1/4">Status</div>
                    <div className="ml-auto">Action</div>
                </div>

                {filteredMembers.map((member) => {
                    const isPresent = attendanceMap.has(member.id);

                    return (
                        <div key={member.id} className={cn(
                            "group relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all duration-500 ease-out",
                            "bg-ocean/20 border-lagoon/10 hover:-translate-y-0.5",
                            isPresent
                                ? "border-green-500/20 bg-green-500/5 hover:border-green-500/40 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]"
                                : "hover:border-lagoon/40 hover:bg-ocean/40 hover:shadow-[0_0_15px_-3px_rgba(28,114,147,0.2)]"
                        )}>
                            {/* Hover Glow */}
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl pointer-events-none",
                                isPresent ? "from-green-500/0 via-green-500/5 to-green-500/0" : "from-lagoon/0 via-lagoon/5 to-lagoon/0"
                            )} />

                            {/* Member Info */}
                            <div className="flex items-center gap-4 w-full md:w-1/3 z-10 mb-3 md:mb-0">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-colors shadow-inner",
                                    isPresent
                                        ? "bg-green-500/20 text-green-400 border-green-500/30 ring-2 ring-green-900/20 ring-offset-2 ring-offset-transparent"
                                        : "bg-ocean-deep text-lagoon-100/50 border-white/5"
                                )}>
                                    {member.firstName[0]}{member.lastName[0]}
                                </div>
                                <div>
                                    <div className={cn(
                                        "font-bold text-lg transition-colors",
                                        isPresent ? "text-white group-hover:text-green-400" : "text-white group-hover:text-lagoon-100"
                                    )}>
                                        {member.firstName} {member.lastName}
                                    </div>
                                    <div className="flex items-center text-[10px] uppercase tracking-wider text-lagoon-100/50 font-semibold mt-0.5">
                                        <span>Warrior</span>
                                    </div>
                                </div>
                            </div>

                            {/* Group */}
                            <div className="w-full md:w-1/4 z-10 mb-2 md:mb-0 pl-14 md:pl-0">
                                <span className={cn(
                                    "text-sm font-medium",
                                    member.team ? "text-lagoon-100/80" : "text-lagoon-100/40 italic"
                                )}>
                                    {member.team?.name || 'Unassigned'}
                                </span>
                            </div>

                            {/* Status Indicator */}
                            <div className="w-full md:w-1/4 z-10 mb-2 md:mb-0 pl-14 md:pl-0">
                                <span className={cn(
                                    "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-sm",
                                    isPresent
                                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                                        : "bg-ocean-deep text-lagoon-100/40 border-white/5"
                                )}>
                                    {isPresent ? 'Present' : 'Absent'}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 md:ml-auto z-10 pl-14 md:pl-0">
                                <form action={async () => {
                                    await toggleAttendance(session.id, member.id, !isPresent);
                                }}>
                                    <Button
                                        size="sm"
                                        type="submit"
                                        variant="secondary"
                                        className={cn(
                                            "h-10 px-4 rounded-lg transition-all font-bold uppercase tracking-wider text-xs border duration-300",
                                            isPresent
                                                ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 hover:border-green-500/30"
                                                : "bg-ocean-deep text-lagoon-100/60 border-white/5 hover:bg-lagoon/10 hover:text-white hover:border-lagoon/30"
                                        )}
                                    >
                                        {isPresent ? (
                                            <>
                                                <Check className="w-4 h-4 mr-2" />
                                                Present
                                            </>
                                        ) : (
                                            <>
                                                <X className="w-4 h-4 mr-2" />
                                                Mark Present
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    );
                })}

                {!hasResults && (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-lagoon-100/40">
                        <Filter className="w-8 h-8 opacity-20 mb-2" />
                        <p>No members found</p>
                    </div>
                )}
            </div>
        </PremiumCard>
    );
}
