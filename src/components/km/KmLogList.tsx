'use client';

import { useState } from 'react';
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Button } from "@/components/ui/Components";
import { Activity, Save, Filter, MapPin } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/lib/utils";
import { submitKmLog } from "@/actions/data";
import Link from 'next/link';

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    team: {
        name: string;
    } | null;
    kmLogs: {
        totalKm: number;
    }[];
}

interface KmLogListProps {
    members: Member[];
    weekId: string;
}

export function KmLogList({ members, weekId }: KmLogListProps) {
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
                            <Activity className="w-5 h-5 text-lagoon-100" />
                        </div>
                        <h2 className="text-lg font-bold text-white">KM Access Logger</h2>
                    </div>
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
                    <div className="w-1/3">Member</div>
                    <div className="w-1/4">Group</div>
                    <div className="w-1/4">Log Distance</div>
                    <div className="ml-auto">Status</div>
                </div>

                {filteredMembers.map((member) => {
                    const currentKm = member.kmLogs[0]?.totalKm;
                    const hasLog = currentKm !== undefined && currentKm > 0;

                    return (
                        <div key={member.id} className={cn(
                            "group relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all duration-500 ease-out",
                            "bg-ocean/20 border-lagoon/10 hover:border-lagoon/40 hover:bg-ocean/40 hover:shadow-[0_0_15px_-3px_rgba(28,114,147,0.2)] hover:-translate-y-0.5"
                        )}>
                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-lagoon/0 via-lagoon/5 to-lagoon/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl pointer-events-none" />

                            {/* Member Info */}
                            <div className="flex items-center gap-4 w-full md:w-1/3 z-10 mb-3 md:mb-0">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-colors shadow-inner",
                                    hasLog
                                        ? "bg-lagoon/20 text-lagoon-100 border-lagoon/30 ring-2 ring-lagoon/10"
                                        : "bg-ocean-deep text-lagoon-100/50 border-white/5"
                                )}>
                                    {member.firstName[0]}{member.lastName[0]}
                                </div>
                                <div>
                                    <div className="font-bold text-white text-lg group-hover:text-lagoon-100 transition-colors">
                                        {member.firstName} {member.lastName}
                                    </div>
                                    <div className="flex items-center text-[10px] uppercase tracking-wider text-lagoon-100/50 font-semibold mt-0.5">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        <span>Voyager</span>
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

                            {/* Input Actions */}
                            <div className="w-full md:w-1/4 z-10 mb-2 md:mb-0 pl-14 md:pl-0">
                                <form action={submitKmLog} className="flex items-center space-x-2">
                                    <input type="hidden" name="memberId" value={member.id} />
                                    <input type="hidden" name="blockWeekId" value={weekId} />
                                    <div className="relative group/input">
                                        <input
                                            name="totalKm"
                                            type="number"
                                            step="0.1"
                                            placeholder="0.0"
                                            className={cn(
                                                "w-24 h-10 pl-3 pr-8 text-sm rounded-lg font-mono font-bold transition-all duration-200",
                                                "bg-ocean-deep/50 border border-lagoon/20 text-white placeholder:text-lagoon-100/30",
                                                "group-hover/input:border-lagoon/50 group-hover/input:bg-ocean-deep",
                                                "focus:outline-none focus:ring-2 focus:ring-lagoon/40 focus:border-lagoon/50"
                                            )}
                                            defaultValue={currentKm}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-lagoon-100/50 pointer-events-none uppercase">km</span>
                                    </div>
                                    <Button size="sm" type="submit" variant="secondary" className="h-10 w-10 p-0 rounded-lg bg-lagoon/10 text-lagoon-100 hover:bg-lagoon/20 border-lagoon/20 hover:scale-105 transition-all">
                                        <Save className="w-4 h-4" />
                                    </Button>
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
