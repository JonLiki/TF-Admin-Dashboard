'use client';

import { useState, useEffect } from 'react';
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Button } from "@/components/ui/Button";
import { Heart, Save, Filter, Camera } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/lib/utils";
import { submitLifestyleLogsBulk } from "@/actions/data";
import { ImportButton } from "@/components/ui/ImportButton";
import { toast } from "sonner";
import { useEntryDrafts } from '@/hooks/useEntryDrafts';

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
    return <LifestyleLogListForm key={weekId} members={members} weekId={weekId} />;
}

function LifestyleLogListForm({ members, weekId }: LifestyleLogListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const { drafts, errors, count, state, formAction, isPending, formRef, change } = useEntryDrafts(submitLifestyleLogsBulk, 'post', 'blockWeekId', weekId, undefined, true);

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
    const recordedCount = members.filter(m => m.lifestyleLogs[0] !== undefined).length;

    return (
        <form ref={formRef} action={formAction} noValidate className="space-y-4 entry-form">
            <input type="hidden" name="blockWeekId" value={weekId} />

            <PremiumCard className="overflow-hidden p-0 border-lagoon/20 bg-ocean-deep/80 backdrop-blur-sm">
                <div className="p-6 border-b border-lagoon/20 space-y-4 bg-ocean/20 backdrop-blur-md">
                    <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-pink-500/10 rounded-lg">
                                <Heart className="w-5 h-5 text-pink-400" />
                            </div>
                            <h2 className="text-lg font-bold text-foreground">Lifestyle Tracker</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ImportButton type="lifestyle" disabled={isPending || count > 0} />
                        <SearchInput
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search members..."
                            className="w-full md:w-64 bg-ocean-deep/50 border-lagoon/30 text-lagoon-100 placeholder:text-foreground/70 focus:border-lagoon/60 focus:ring-lagoon/20"
                        />
                    </div>
                </div>

                <div className="p-4 space-y-3 bg-ocean-deep/30 min-h-[400px]">
                    {/* Headers */}
                    <div className="hidden md:flex px-6 py-2 text-xs font-bold text-foreground/70 uppercase tracking-widest opacity-80">
                        <div className="w-1/3">Member</div>
                        <div className="w-1/4">Group</div>
                        <div className="w-1/4">Post Count</div>
                        <div className="ml-auto">Status</div>
                    </div>

                    {filteredMembers.map((member) => (
                        <LifestyleRow key={member.id} member={member}
                            value={drafts[member.id] ?? String(member.lifestyleLogs[0]?.postCount ?? '')}
                            onChange={value => change(member.id, value, String(member.lifestyleLogs[0]?.postCount ?? ''))}
                            error={errors[member.id]} disabled={isPending} />
                    ))}

                    {!hasResults && (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-foreground/70">
                            <Filter className="w-8 h-8 opacity-20 mb-2" />
                            <p>No members found</p>
                        </div>
                    )}
                </div>
            </PremiumCard>

            {/* Floating save bar — sticks to the bottom of the page scroll area */}
            <div className="sticky bottom-4 z-30 flex items-center justify-between gap-4 px-5 py-3 rounded-xl border border-lagoon/30 bg-ocean-deep/90 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <span className="text-sm font-semibold text-foreground/80">
                    {count ? `${count} unsaved change${count === 1 ? '' : 's'}` : `${recordedCount} of ${members.length} recorded`}
                </span>
                <Button type="submit" isLoading={isPending} disabled={!count} className="min-w-[150px]">
                    {isPending ? (
                        'Saving...'
                    ) : (
                        <><Save className="w-4 h-4 mr-2" /> Save changes</>
                    )}
                </Button>
            </div>
            <p role={state?.success === false ? 'alert' : 'status'} className="text-sm text-foreground/80">
                {Object.keys(errors).length ? `${Object.keys(errors).length} entries need correction. Clear your search to see all entries. ` : ''}
                {state?.message ?? 'Changes stay here while you search. Save before switching dates, weeks, or pages.'}
            </p>
        </form>
    );
}

function LifestyleRow({ member, value, onChange, error, disabled }: { member: Member; value: string; onChange: (value: string) => void; error?: string; disabled: boolean }) {
    const currentPosts = member.lifestyleLogs[0]?.postCount;
    const hasLog = currentPosts !== undefined;

    return (
        <div className={cn(
            "group relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all duration-500 ease-out",
            "bg-ocean/20 border-lagoon/10 hover:border-pink-500/40 hover:bg-ocean/40"
        )}>
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl pointer-events-none" />

            {/* Member Info */}
            <div className="flex items-center gap-4 w-full md:w-1/3 z-10 mb-3 md:mb-0">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-colors shadow-inner",
                    hasLog
                        ? "bg-pink-500/20 text-pink-400 border-pink-500/30 ring-2 ring-pink-500/10"
                        : "bg-ocean-deep text-foreground/70 border-white/5"
                )}>
                    {member.firstName[0]}{member.lastName[0]}
                </div>
                <div>
                    <div className="font-bold text-foreground text-lg group-hover:text-pink-400 transition-colors">
                        {member.firstName} {member.lastName}
                    </div>
                    <div className="flex items-center text-xs uppercase tracking-wider text-foreground/70 font-semibold mt-0.5">
                        <Camera className="w-3 h-3 mr-1" />
                        <span>Influencer</span>
                    </div>
                </div>
            </div>

            {/* Group */}
            <div className="w-full md:w-1/4 z-10 mb-2 md:mb-0 pl-14 md:pl-0">
                <span className={cn(
                    "text-sm font-medium",
                    member.team ? "text-lagoon-100/80" : "text-foreground/70 italic"
                )}>
                    {member.team?.name || 'Unassigned'}
                </span>
            </div>

            {/* Post Count Input */}
            <div className="w-full md:w-1/4 z-10 mb-2 md:mb-0 pl-14 md:pl-0">
                <div className="relative group/input inline-block">
                    <input
                        name={`post_${member.id}`}
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        placeholder="0"
                        aria-label={`Lifestyle posts for ${member.firstName} ${member.lastName}`}
                        className={cn(
                            "w-24 h-12 md:h-10 pl-3 pr-2 text-sm rounded-lg font-mono font-bold transition-all duration-200",
                            "bg-ocean-deep/50 border border-lagoon/20 text-foreground placeholder:text-foreground/60",
                            "group-hover/input:border-pink-500/50 group-hover/input:bg-ocean-deep",
                            "focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/50"
                        )}
                        value={value}
                        onChange={event => onChange(event.target.value)}
                        disabled={disabled}
                        aria-invalid={!!error}
                        aria-describedby={error ? `entry-${member.id}-error` : undefined}
                    />
                </div>
            </div>

            {error && <p id={`entry-${member.id}-error`} className="text-sm text-red-600 dark:text-red-300 md:max-w-48">{error}</p>}

            {/* Status Indicator */}
            <div className="flex items-center gap-2 md:ml-auto z-10 pl-14 md:pl-0">
                {hasLog && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.15)]">
                        Active
                    </span>
                )}
            </div>
        </div>
    );
}
