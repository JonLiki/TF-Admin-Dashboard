'use client';

import { useState } from 'react';
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Dumbbell, Save, Filter, MapPin } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/lib/utils";
import { submitBenchmarkLog } from "@/actions/data";

import { SubmitIconButton } from "@/components/ui/SubmitIconButton";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    team: {
        name: string;
    } | null;
    benchmarkLogs: {
        squats: number;
        pushups: number;
        burpees: number;
    }[];
}

interface BenchmarkLogListProps {
    members: Member[];
    weekId: string;
    dateStr: string;
}

export function BenchmarkLogList({ members, weekId, dateStr }: BenchmarkLogListProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMembers = members.filter(member =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.team?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const hasResults = filteredMembers.length > 0;

    return (
        <PremiumCard className="overflow-hidden p-0 border-lagoon/20 bg-ocean-deep/80 backdrop-blur-sm">
            <div className="p-6 border-b border-lagoon/20 space-y-4 bg-ocean/20 backdrop-blur-md">
                <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-lagoon/10 rounded-lg">
                            <Dumbbell className="w-5 h-5 text-lagoon-100" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Benchmark Logger</h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search members..."
                        className="w-full md:w-64 bg-ocean-deep/50 border-lagoon/30 text-lagoon-100 placeholder:text-lagoon-100/50 focus:border-lagoon/60 focus:ring-lagoon/20"
                    />
                </div>
            </div>

            <div className="p-4 space-y-3 bg-ocean-deep/30 min-h-[400px]">
                {/* Headers */}
                <div className="hidden md:flex px-6 py-2 text-xs font-bold text-lagoon-100/50 uppercase tracking-widest opacity-80">
                    <div className="w-1/4">Member</div>
                    <div className="w-1/6">Group</div>
                    <div className="w-1/2 text-center">Max Scores (Squats, Pushups, Burpees)</div>
                    <div className="ml-auto">Status</div>
                </div>

                {filteredMembers.map((member) => (
                    <BenchmarkRow key={member.id} member={member} weekId={weekId} dateStr={dateStr} />
                ))}

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

function BenchmarkRow({ member, weekId, dateStr }: { member: Member, weekId: string, dateStr: string }) {
    const [state, formAction] = useActionState(submitBenchmarkLog, null);

    useEffect(() => {
        if (state?.message) {
            if (state.success) toast.success("Benchmarks saved!");
            else toast.error(state.message);
        }
    }, [state]);

    const log = member.benchmarkLogs[0];
    const hasLog = log !== undefined && (log.squats > 0 || log.pushups > 0 || log.burpees > 0);

    return (
        <div className={cn(
            "group relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all duration-500 ease-out",
            "bg-ocean/20 border-lagoon/10 hover:border-lagoon/40 hover:bg-ocean/40 hover:shadow-[0_0_15px_-3px_rgba(28,114,147,0.2)] hover:-translate-y-0.5"
        )}>
            {/* Member Info */}
            <div className="flex items-center gap-4 w-full md:w-1/4 z-10 mb-3 md:mb-0">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-colors shadow-inner flex-shrink-0",
                    hasLog
                        ? "bg-lagoon/20 text-lagoon-100 border-lagoon/30 ring-2 ring-lagoon/10"
                        : "bg-ocean-deep text-lagoon-100/50 border-white/5"
                )}>
                    {member.firstName[0]}{member.lastName[0]}
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-white text-base truncate group-hover:text-lagoon-100 transition-colors">
                        {member.firstName} {member.lastName}
                    </div>
                </div>
            </div>

            {/* Group */}
            <div className="w-full md:w-1/6 z-10 mb-2 md:mb-0 pl-14 md:pl-0">
                <span className={cn(
                    "text-sm font-medium",
                    member.team ? "text-lagoon-100/80" : "text-lagoon-100/40 italic"
                )}>
                    {member.team?.name || 'Unassigned'}
                </span>
            </div>

            {/* Input Actions */}
            <div className="w-full md:w-something z-10 mb-2 md:mb-0 pl-14 md:pl-0">
                <form action={formAction} className="flex items-center space-x-2 flex-wrap">
                    <input type="hidden" name="memberId" value={member.id} />
                    <input type="hidden" name="blockWeekId" value={weekId} />
                    <input type="hidden" name="date" value={dateStr} />
                    
                    <div className="flex space-x-2">
                        <div className="relative group/input flex justify-center items-center">
                            <input
                                name="squats"
                                type="number"
                                inputMode="numeric"
                                placeholder="0"
                                className={cn(
                                    "w-16 h-10 md:h-10 pl-3 pr-2 text-center text-sm rounded-lg font-mono font-bold transition-all duration-200",
                                    "bg-ocean-deep/50 border border-lagoon/20 text-white placeholder:text-lagoon-100/30",
                                    "focus:outline-none focus:ring-2 focus:ring-lagoon/40 focus:border-lagoon/50"
                                )}
                                defaultValue={log?.squats || ""}
                                title="Squats"
                            />
                            <span className="text-[10px] ml-1 uppercase text-lagoon-100/50 font-bold hidden md:inline">SQ</span>
                        </div>

                        <div className="relative group/input flex justify-center items-center">
                            <input
                                name="pushups"
                                type="number"
                                inputMode="numeric"
                                placeholder="0"
                                className={cn(
                                    "w-16 h-10 md:h-10 pl-3 pr-2 text-center text-sm rounded-lg font-mono font-bold transition-all duration-200",
                                    "bg-ocean-deep/50 border border-lagoon/20 text-white placeholder:text-lagoon-100/30",
                                    "focus:outline-none focus:ring-2 focus:ring-lagoon/40 focus:border-lagoon/50"
                                )}
                                defaultValue={log?.pushups || ""}
                                title="Pushups"
                            />
                            <span className="text-[10px] ml-1 uppercase text-lagoon-100/50 font-bold hidden md:inline">PU</span>
                        </div>

                        <div className="relative group/input flex justify-center items-center">
                            <input
                                name="burpees"
                                type="number"
                                inputMode="numeric"
                                placeholder="0"
                                className={cn(
                                    "w-16 h-10 md:h-10 pl-3 pr-2 text-center text-sm rounded-lg font-mono font-bold transition-all duration-200",
                                    "bg-ocean-deep/50 border border-lagoon/20 text-white placeholder:text-lagoon-100/30",
                                    "focus:outline-none focus:ring-2 focus:ring-lagoon/40 focus:border-lagoon/50"
                                )}
                                defaultValue={log?.burpees || ""}
                                title="Burpees"
                            />
                            <span className="text-[10px] ml-1 uppercase text-lagoon-100/50 font-bold hidden md:inline">BP</span>
                        </div>
                    </div>

                    <SubmitIconButton 
                        icon={<Save className="w-4 h-4" />} 
                        className="bg-lagoon/10 text-lagoon-100 hover:bg-lagoon/20 border-lagoon/20 hover:scale-105 ml-2"
                    />
                </form>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 md:ml-auto z-10 pl-14 md:pl-0">
                {hasLog && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-lagoon/10 text-lagoon-100 border border-lagoon/20 shadow-[0_0_10px_rgba(28,114,147,0.15)]">
                        Logged
                    </span>
                )}
            </div>
        </div>
    );
}
