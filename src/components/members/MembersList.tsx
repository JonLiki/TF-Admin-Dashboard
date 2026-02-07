'use client';

import { useState, useMemo } from 'react';
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Button } from "@/components/ui/Components";
import { UserX, UserCheck, Trash2, Filter } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toggleMemberActive, deleteMember } from "@/actions";
import { toast } from 'sonner';

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    team: {
        id: string;
        name: string;
    } | null;
}

interface Team {
    id: string;
    name: string;
}

interface MembersListProps {
    members: Member[];
    teams: Team[];
}

export function MembersList({ members, teams }: MembersListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeam, setSelectedTeam] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Filter members based on search and filters
    const filteredMembers = useMemo(() => {
        return members.filter(member => {
            // Search filter (name)
            const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
            const matchesSearch = fullName.includes(searchTerm.toLowerCase());

            // Team filter
            const matchesTeam = selectedTeam === 'all' ||
                (selectedTeam === 'none' && !member.team) ||
                member.team?.id === selectedTeam;

            // Status filter
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && member.isActive) ||
                (statusFilter === 'inactive' && !member.isActive);

            return matchesSearch && matchesTeam && matchesStatus;
        });
    }, [members, searchTerm, selectedTeam, statusFilter]);

    const hasFilters = selectedTeam !== 'all' || statusFilter !== 'all' || searchTerm.trim().length > 0;
    const activeFilterCount = [
        selectedTeam !== 'all',
        statusFilter !== 'all',
        searchTerm.trim().length > 0
    ].filter(Boolean).length;

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedTeam('all');
        setStatusFilter('all');
    };

    return (
        <div className="lg:col-span-3">
            <PremiumCard className="border-lagoon/20 bg-ocean-deep/80 backdrop-blur-sm">
                {/* Search and Filters Header */}
                <div className="relative z-20 p-6 border-b border-lagoon/20 space-y-4 bg-ocean/20 backdrop-blur-md">
                    {/* Search Input */}
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search members by name..."
                        className="bg-ocean-deep/50 border-lagoon/30 text-lagoon-100 placeholder:text-lagoon-100/50 focus:border-lagoon/60 focus:ring-lagoon/20"
                    />

                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="flex items-center gap-2 text-sm text-lagoon-100/70">
                            <Filter className="w-4 h-4 text-tapa" />
                            <span className="font-medium text-tapa/90">Filters:</span>
                        </div>

                        {/* Team Filter */}
                        <Select
                            options={[
                                { value: 'all', label: 'All Groups' },
                                { value: 'none', label: 'No Group' },
                                ...teams.map(t => ({ value: t.id, label: t.name }))
                            ]}
                            value={selectedTeam}
                            onChange={setSelectedTeam}
                            className="w-full sm:w-48 bg-ocean-deep text-lagoon-100 border-lagoon/30"
                        />

                        {/* Status Filter */}
                        <Select
                            options={[
                                { value: 'all', label: 'All Status' },
                                { value: 'active', label: 'Active Only' },
                                { value: 'inactive', label: 'Inactive Only' }
                            ]}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            className="w-full sm:w-40 bg-ocean-deep text-lagoon-100 border-lagoon/30"
                        />

                        {/* Clear Filters */}
                        {hasFilters && (
                            <button
                                onClick={handleClearFilters}
                                className="text-sm text-lagoon-100/60 hover:text-white transition-colors underline decoration-tapa/50 hover:decoration-tapa"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Results Count */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-lagoon-100/60">
                            Showing <span className="text-white font-medium">{filteredMembers.length}</span> of{' '}
                            <span className="text-white font-medium">{members.length}</span> members
                            {activeFilterCount > 0 && (
                                <span className="ml-2 text-xs text-tapa">
                                    ({activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active)
                                </span>
                            )}
                        </span>
                    </div>
                </div>

                {/* MEMBERS GRID / LIST */}
                <div className="p-4 space-y-3 bg-ocean-deep/30 min-h-[500px]">
                    {/* Column Headers (Visual Only) */}
                    <div className="hidden md:flex px-6 py-2 text-xs font-bold text-lagoon-100/50 uppercase tracking-widest opacity-80">
                        <div className="w-1/3">Member</div>
                        <div className="w-1/4">Group</div>
                        <div className="w-1/4">Status</div>
                        <div className="ml-auto">Actions</div>
                    </div>

                    {filteredMembers.map((member, index) => (
                        <div
                            key={member.id}
                            className={cn(
                                "group relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all duration-500 ease-out",
                                "bg-ocean/20 border-lagoon/10 hover:border-lagoon/40 hover:bg-ocean/40 hover:shadow-[0_0_15px_-3px_rgba(28,114,147,0.2)] hover:-translate-y-0.5"
                            )}
                        >
                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-lagoon/0 via-lagoon/5 to-lagoon/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl pointer-events-none" />

                            {/* Name & Avatar */}
                            <div className="flex items-center gap-4 w-full md:w-1/3 z-10 mb-3 md:mb-0">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border shadow-inner",
                                    member.team
                                        ? "bg-ocean text-white border-ocean-light ring-2 ring-ocean-deep ring-offset-2 ring-offset-transparent"
                                        : "bg-ocean-deep text-lagoon-100/50 border-white/5"
                                )}>
                                    {member.firstName[0]}{member.lastName[0]}
                                </div>
                                <div>
                                    <Link
                                        href={`/members/${member.id}`}
                                        className="font-bold text-white text-lg hover:text-lagoon-100 transition-colors"
                                    >
                                        {member.firstName} {member.lastName}
                                    </Link>
                                    <p className="text-[10px] uppercase tracking-wider text-tapa font-semibold opacity-80">Member</p>
                                </div>
                            </div>

                            {/* Group */}
                            <div className="w-full md:w-1/4 z-10 mb-2 md:mb-0 pl-14 md:pl-0">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", member.team ? "bg-tongan-red shadow-[0_0_8px_rgba(200,16,46,0.5)]" : "bg-slate-600")} />
                                    <span className={cn(
                                        "text-sm font-medium",
                                        member.team ? "text-white" : "text-lagoon-100/40 italic"
                                    )}>
                                        {member.team?.name || 'Unassigned'}
                                    </span>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="w-full md:w-1/4 z-10 mb-4 md:mb-0 pl-14 md:pl-0">
                                <span className={cn(
                                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border",
                                    member.isActive
                                        ? "bg-lagoon/10 text-lagoon-100 border-lagoon/30 shadow-[0_0_10px_-4px_rgba(28,114,147,0.5)]"
                                        : "bg-tongan/10 text-tongan-red border-tongan/20"
                                )}>
                                    {member.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 md:ml-auto z-10 pl-14 md:pl-0">
                                <form action={async () => {
                                    const res = await toggleMemberActive(member.id, member.isActive);
                                    if (res.success) toast.success(res.message);
                                    else toast.error(res.message);
                                }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        type="submit"
                                        className={cn(
                                            "hover:bg-white/5 transition-colors duration-300",
                                            member.isActive ? "text-lagoon-100/60 hover:text-tongan-red" : "text-lagoon-100/60 hover:text-lagoon"
                                        )}
                                        title={member.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {member.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                    </Button>
                                </form>
                                <form action={async () => {
                                    // Make this safer, ideally confirmed
                                    if (confirm('Are you sure?')) {
                                        const res = await deleteMember(member.id);
                                        if (res.success) toast.success(res.message);
                                        else toast.error(res.message);
                                    }
                                }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        type="submit"
                                        className="text-lagoon-100/60 hover:text-tongan-red hover:bg-tongan/10 transition-colors duration-300"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State / No Results */}
                {
                    filteredMembers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="w-16 h-16 bg-ocean-deep/50 border border-lagoon/20 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-ocean-deep">
                                <Filter className="w-8 h-8 text-lagoon-100 opacity-50" />
                            </div>
                            <h3 className="text-white font-bold text-lg">No members found</h3>
                            <p className="text-lagoon-100/60 text-sm max-w-xs mt-2">
                                {hasFilters ? "Try adjusting your search or filters to see more results." : "Get started by adding a new member to the team."}
                            </p>
                            {hasFilters && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearFilters}
                                    className="mt-6 border-lagoon/30 text-lagoon-100 hover:bg-lagoon/10 hover:border-lagoon/50"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    )
                }
            </PremiumCard >
        </div >
    );
}
