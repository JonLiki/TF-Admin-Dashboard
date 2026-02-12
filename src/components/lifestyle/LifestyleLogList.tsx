'use client';

import { useState } from 'react';
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Button } from "@/components/ui/Components";
import { Heart, Save, Filter, Camera } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/lib/utils";
import { submitLifestyleLog } from "@/actions/data";
import { ImportButton } from "@/components/ui/ImportButton";

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    team: {
        name: string;
    } | null;
    lifestyleLogs: {
        postCount: number;
    }[];
}

interface LifestyleLogListProps {
    members: Member[];
    weekId: string;
}

export function LifestyleLogList({ members, weekId }: LifestyleLogListProps) {
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
                        <div className="p-2 bg-pink-500/10 rounded-lg">
                            <Heart className="w-5 h-5 text-pink-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Lifestyle Tracker</h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ImportButton type="lifestyle" />
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
                    <div className="w-1/4">Post Count</div>
                    <div className="ml-auto">Status</div>
                </div>

                {filteredMembers.map((member) => {
                    const currentPosts = member.lifestyleLogs[0]?.postCount;
                    const hasLog = currentPosts !== undefined && currentPosts > 0;

                    return (
                        <div key={member.id} className={cn(
                            "group relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all duration-500 ease-out",
                            "bg-ocean/20 border-lagoon/10 hover:border-pink-500/40 hover:bg-ocean/40 hover:shadow-[0_0_15px_-3px_rgba(236,72,153,0.15)] hover:-translate-y-0.5"
                        )}>
                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl pointer-events-none" />

                            {/* Member Info */}
                            <div className="flex items-center gap-4 w-full md:w-1/3 z-10 mb-3 md:mb-0">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-colors shadow-inner",
                                    hasLog
                                        ? "bg-pink-500/20 text-pink-400 border-pink-500/30 ring-2 ring-pink-500/10"
                                        : "bg-ocean-deep text-lagoon-100/50 border-white/5"
                                )}>
                                    {member.firstName[0]}{member.lastName[0]}
                                </div>
                                <div>
                                    <div className="font-bold text-white text-lg group-hover:text-pink-400 transition-colors">
                                        {member.firstName} {member.lastName}
                                    </div>
                                    <div className="flex items-center text-[10px] uppercase tracking-wider text-lagoon-100/50 font-semibold mt-0.5">
                                        <Camera className="w-3 h-3 mr-1" />
                                        <span>Influencer</span>
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
                                <form action={async (formData) => { await submitLifestyleLog(formData); }} className="flex items-center space-x-2">
                                    <input type="hidden" name="memberId" value={member.id} />
                                    <input type="hidden" name="blockWeekId" value={weekId} />
                                    <div className="relative group/input">
                                        <input
                                            name="postCount"
                                            type="number"
                                            placeholder="0"
                                            className={cn(
                                                "w-24 h-10 pl-3 pr-2 text-sm rounded-lg font-mono font-bold transition-all duration-200",
                                                "bg-ocean-deep/50 border border-lagoon/20 text-white placeholder:text-lagoon-100/30",
                                                "group-hover/input:border-pink-500/50 group-hover/input:bg-ocean-deep",
                                                "focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/50"
                                            )}
                                            defaultValue={currentPosts}
                                        />
                                    </div>
                                    <Button size="sm" type="submit" variant="secondary" className="h-10 w-10 p-0 rounded-lg bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 border-pink-500/20 hover:scale-105 transition-all">
                                        <Save className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>

                            {/* Status Indicator */}
                            <div className="flex items-center gap-2 md:ml-auto z-10 pl-14 md:pl-0">
                                {hasLog && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.15)]">
                                        Active
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
