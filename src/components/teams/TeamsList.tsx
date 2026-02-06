'use client';

import { useState, useMemo } from 'react';
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Button } from "@/components/ui/Components";
import { Users, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { deleteTeam } from "@/actions";
import { cn } from "@/lib/utils";

interface Team {
    id: string;
    name: string;
    _count: {
        members: number;
    };
}

interface TeamsListProps {
    teams: Team[];
}

export function TeamsList({ teams }: TeamsListProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter teams based on search
    const filteredTeams = useMemo(() => {
        if (!searchTerm.trim()) return teams;

        return teams.filter(team =>
            team.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [teams, searchTerm]);

    const hasResults = filteredTeams.length > 0;
    const isSearching = searchTerm.trim().length > 0;

    return (
        <div className="lg:col-span-2 space-y-4">
            <PremiumCard className="overflow-hidden p-0 border-lagoon/20 bg-ocean-deep/80 backdrop-blur-sm">
                {/* Search Header - Matches MembersList */}
                <div className="p-6 border-b border-lagoon/20 space-y-4 bg-ocean/20 backdrop-blur-md">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search groups..."
                        className="bg-ocean-deep/50 border-lagoon/30 text-lagoon-100 placeholder:text-lagoon-100/50 focus:border-lagoon/60 focus:ring-lagoon/20"
                    />
                    {/* Results Count */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-lagoon-100/60">
                            Showing <span className="text-white font-medium">{filteredTeams.length}</span> of <span className="text-white font-medium">{teams.length}</span> groups
                        </span>
                    </div>
                </div>

                {/* TEAMS LIST - FLOATING CARDS */}
                <div className="p-4 space-y-3 bg-ocean-deep/30 min-h-[400px]">
                    {/* Column Headers (Visual Only) */}
                    <div className="hidden md:flex px-6 py-2 text-xs font-bold text-lagoon-100/50 uppercase tracking-widest opacity-80">
                        <div className="w-1/2">Group Name</div>
                        <div className="w-1/4">Members</div>
                        <div className="ml-auto">Actions</div>
                    </div>

                    {filteredTeams.map((team) => (
                        <div
                            key={team.id}
                            className={cn(
                                "group relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all duration-500 ease-out",
                                "bg-ocean/20 border-lagoon/10 hover:border-lagoon/40 hover:bg-ocean/40 hover:shadow-[0_0_15px_-3px_rgba(28,114,147,0.2)] hover:-translate-y-0.5"
                            )}
                        >
                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-lagoon/0 via-lagoon/5 to-lagoon/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl pointer-events-none" />

                            {/* Team Name */}
                            <div className="flex items-center gap-4 w-full md:w-1/2 z-10 mb-3 md:mb-0">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border bg-tongan/10 text-tongan border-tongan/20 shadow-[0_0_8px_rgba(200,16,46,0.3)]">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg group-hover:text-lagoon-100 transition-colors">
                                        {team.name}
                                    </h3>
                                    <p className="text-[10px] uppercase tracking-wider text-tapa font-semibold opacity-80">Group</p>
                                </div>
                            </div>

                            {/* Member Count */}
                            <div className="w-full md:w-1/4 z-10 mb-2 md:mb-0 pl-14 md:pl-0">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-ocean-deep/50 text-lagoon-100/80 border border-lagoon/20">
                                        {team._count.members} Member{team._count.members !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 md:ml-auto z-10 pl-14 md:pl-0">
                                <form action={async () => {
                                    if (confirm('Are you sure you want to delete this group? All members will be unassigned.')) await deleteTeam(team.id);
                                }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        type="submit"
                                        className="text-lagoon-100/60 hover:text-tongan-red hover:bg-tongan/10 transition-colors duration-300"
                                        title="Delete Group"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {!hasResults && isSearching && (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="w-16 h-16 bg-ocean-deep/50 border border-lagoon/20 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-ocean-deep">
                            <Users className="w-8 h-8 text-lagoon-100 opacity-50" />
                        </div>
                        <h3 className="text-white font-bold text-lg">No groups found</h3>
                        <p className="text-lagoon-100/60 text-sm max-w-xs mt-2">
                            Try adjusting your search term
                        </p>
                    </div>
                )}

                {teams.length === 0 && !isSearching && (
                    <div className="p-8">
                        <EmptyState
                            icon={Users}
                            title="No Groups Yet"
                            description="Create your first group to start organizing your warriors into teams."
                            actionLabel="Create First Group"
                            actionHref="#"
                        />
                    </div>
                )}
            </PremiumCard>
        </div>
    );
}
