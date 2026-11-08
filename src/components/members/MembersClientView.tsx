'use client';

import { useState, useActionState } from 'react';
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { createMember } from "@/actions";
import { UserPlus, Plus } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { MembersList } from "@/components/members/MembersList";
import { OceanWaves } from "@/components/ui/Patterns";
import { Sheet } from "@/components/ui/Sheet";
import { Team, Member } from '@prisma/client';

type MemberWithTeam = Member & { team: Team | null };

interface MembersPageProps {
    members: MemberWithTeam[];
    teams: Team[];
}

export function MembersClientView({ members, teams }: MembersPageProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    return (
        <div className="min-h-full pb-10 relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
                <OceanWaves />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <PageHeader title="Members" subtitle="Member Management" />
                <Button
                    onClick={() => setIsSheetOpen(true)}
                    className="lg:hidden shrink-0 bg-lagoon text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                </Button>
            </div>

            <div className="px-6 md:px-10 mt-6 grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
                {/* Create Member Form - Desktop Sticky */}
                <div className="hidden lg:block lg:col-span-1">
                    <PremiumCard className="p-6 sticky top-6 bg-ocean-deep/80 backdrop-blur-md border border-white/10 shadow-2xl group">
                        {/* Decorative Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-lagoon/10 blur-[50px] rounded-full pointer-events-none -mr-10 -mt-10" />

                        <div className="flex items-center space-x-3 mb-6 relative z-10">
                            <div className="p-2.5 bg-gradient-to-br from-[#00A0D1] to-[#005F99] text-white rounded-xl shadow-lg shadow-lagoon/20 ring-1 ring-white/10">
                                <UserPlus className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground tracking-tight">New Member</h3>
                        </div>

                        <AddMemberForm onSuccess={() => setIsSheetOpen(false)} teams={teams} />
                    </PremiumCard>
                </div>

                {/* Mobile Drawer Form */}
                <Sheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="Add New Member">
                    <div className="mt-4">
                        <AddMemberForm onSuccess={() => setIsSheetOpen(false)} teams={teams} />
                    </div>
                </Sheet>

                {/* Members List with Search and Filters */}
                <MembersList members={members} teams={teams} />
            </div>
        </div>
    );
}

function AddMemberForm({ onSuccess, teams }: { onSuccess: () => void, teams: Team[] }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [teamId, setTeamId] = useState('');
    const [state, action, pending] = useActionState(async (_previous: { success: boolean; message: string } | null, data: FormData) => {
        try {
            const result = await createMember(data);
            if (result.success) { setFirstName(''); setLastName(''); setTeamId(''); onSuccess(); }
            return result;
        } catch { return { success: false, message: 'Could not add this member. Please try again.' }; }
    }, null);
    return (
        <form action={action} className="space-y-4 relative z-10">
            <Input disabled={pending} name="firstName" value={firstName} onChange={event => setFirstName(event.target.value)} label="First Name" placeholder="Sione" required className="bg-black/20 border-white/10 focus:border-lagoon/50" />
            <Input disabled={pending} name="lastName" value={lastName} onChange={event => setLastName(event.target.value)} label="Last Name" placeholder="Tui" required className="bg-black/20 border-white/10 focus:border-lagoon/50" />
            <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground/80 ml-1">Assign team</p>
                <Select
                    label="Assign team" value={teamId} onChange={setTeamId}
                    disabled={pending}
                    options={[
                        { value: '', label: 'No team' },
                        ...teams.map(t => ({ value: t.id, label: t.name }))
                    ]}
                    name="teamId"
                    placeholder="Select a team"
                    className="bg-black/20 border-white/10 focus:border-lagoon/50"
                />
            </div>
            <p role={state?.success === false ? 'alert' : 'status'} className="text-sm">{state?.message}</p>
            <Button type="submit" isLoading={pending} className="w-full mt-2 bg-lagoon hover:bg-lagoon-light text-white shadow-lagoon/20" size="md">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
            </Button>
        </form>
    );
}
