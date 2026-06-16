'use client';

import { useState, useActionState, useEffect } from 'react';
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Button } from "@/components/ui/Button";
import { Scale, Save, Filter, Loader2 } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/lib/utils";
import { submitWeighInsBulk } from "@/actions/data";
import { ImportButton } from "@/components/ui/ImportButton";
import { toast } from "sonner";

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    team: {
        name: string;
    } | null;
    weighIns: {
        weight: number;
    }[];
}

interface WeighInLogListProps {
    members: Member[];
    dateStr: string;
}

export function WeighInLogList({ members, dateStr }: WeighInLogListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [state, formAction, isPending] = useActionState(submitWeighInsBulk, null);

    useEffect(() => {
        if (state?.message) {
            if (state.success) toast.success(state.message);
            else toast.error(state.message);
        }
    }, [state]);

    const filteredMembers = members.filter(member =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.team?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const hasResults = filteredMembers.length > 0;
    const recordedCount = members.filter(m => (m.weighIns[0]?.weight ?? 0) > 0).length;

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="date" value={dateStr} />

            <PremiumCard className="overflow-hidden p-0 border-lagoon/20 bg-ocean-deep/80 backdrop-blur-sm">
                <div className="p-6 border-b border-lagoon/20 space-y-4 bg-ocean/20 backdrop-blur-md">
                    <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-tongan/10 rounded-lg">
                                <Scale className="w-5 h-5 text-tongan-red" />
                            </div>
                            <h2 className="text-lg font-bold text-foreground">Daily Weigh-In</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ImportButton type="weigh-in" />
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
                        <div className="w-1/4">Weight (kg)</div>
                        <div className="ml-auto">Status</div>
                    </div>

                    {filteredMembers.map((member) => (
                        <WeighInRow key={`${member.id}-${member.weighIns[0]?.weight ?? 'none'}`} member={member} />
                    ))}

                    {!hasResults && (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-lagoon-100/40">
                            <Filter className="w-8 h-8 opacity-20 mb-2" />
                            <p>No members found</p>
                        </div>
                    )}
                </div>
            </PremiumCard>

            {/* Floating save bar — sticks to the bottom of the page scroll area */}
            <div className="sticky bottom-4 z-30 flex items-center justify-between gap-4 px-5 py-3 rounded-xl border border-lagoon/30 bg-ocean-deep/90 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <span className="text-xs font-semibold text-lagoon-100/70">
                    {recordedCount} of {members.length} recorded
                </span>
                <Button type="submit" isLoading={isPending} className="min-w-[150px]">
                    {isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                    ) : (
                        <><Save className="w-4 h-4 mr-2" /> Save all</>
                    )}
                </Button>
            </div>
        </form>
    );
}

function WeighInRow({ member }: { member: Member }) {
    const currentWeight = member.weighIns[0]?.weight;
    const hasLog = currentWeight !== undefined && currentWeight > 0;

    return (
        <div className={cn(
            "group relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all duration-500 ease-out",
            "bg-ocean/20 border-lagoon/10 hover:border-tongan/40 hover:bg-ocean/40 hover:shadow-[0_0_15px_-3px_rgba(200,16,46,0.15)] hover:-translate-y-0.5"
        )}>
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-tongan/0 via-tongan/5 to-tongan/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl pointer-events-none" />

            {/* Member Info */}
            <div className="flex items-center gap-4 w-full md:w-1/3 z-10 mb-3 md:mb-0">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-colors shadow-inner",
                    hasLog
                        ? "bg-tongan/10 text-tongan-red border-tongan/30 ring-2 ring-tongan/10"
                        : "bg-ocean-deep text-lagoon-100/50 border-white/5"
                )}>
                    {member.firstName[0]}{member.lastName[0]}
                </div>
                <div>
                    <div className="font-bold text-foreground text-lg group-hover:text-tongan-red transition-colors">
                        {member.firstName} {member.lastName}
                    </div>
                    <div className="flex items-center text-micro uppercase tracking-wider text-lagoon-100/50 font-semibold mt-0.5">
                        <span>Contender</span>
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

            {/* Weight Input */}
            <div className="w-full md:w-1/4 z-10 mb-2 md:mb-0 pl-14 md:pl-0">
                <div className="relative group/input inline-block">
                    <input
                        name={`weight_${member.id}`}
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        aria-label={`Weight in kg for ${member.firstName} ${member.lastName}`}
                        className={cn(
                            "w-28 h-12 md:h-10 pl-3 pr-8 text-sm rounded-lg font-mono font-bold transition-all duration-200",
                            "bg-ocean-deep/50 border border-lagoon/20 text-foreground placeholder:text-lagoon-100/30",
                            "group-hover/input:border-tongan/50 group-hover/input:bg-ocean-deep",
                            "focus:outline-none focus:ring-2 focus:ring-tongan/40 focus:border-tongan/50"
                        )}
                        defaultValue={currentWeight}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-micro font-bold text-lagoon-100/50 pointer-events-none uppercase">kg</span>
                </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 md:ml-auto z-10 pl-14 md:pl-0">
                {hasLog && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-micro font-bold uppercase tracking-wide bg-tongan/10 text-tongan-red border border-tongan/20 shadow-[0_0_10px_rgba(200,16,46,0.15)]">
                        Recorded
                    </span>
                )}
            </div>
        </div>
    );
}
