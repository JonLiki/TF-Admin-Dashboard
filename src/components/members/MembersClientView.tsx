'use client';

import { useState, useActionState } from 'react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { createMember } from "@/actions";
import { UserPlus, Plus } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { MembersList } from "@/components/members/MembersList";
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
            <PageHeader title="Members" subtitle="Manage members and team assignments">
                <Button onClick={() => setIsSheetOpen(true)}><Plus className="w-4 h-4 mr-2" />Add member</Button>
            </PageHeader>
            <Sheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="Add member">
                <div className="mt-4"><AddMemberForm onSuccess={() => setIsSheetOpen(false)} teams={teams} /></div>
            </Sheet>
            <div className="px-4 sm:px-6 md:px-10 mt-6">
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
            <Input disabled={pending} name="firstName" value={firstName} onChange={event => setFirstName(event.target.value)} label="First Name" placeholder="Sione" required className="bg-surface-ocean border-border focus:border-lagoon" />
            <Input disabled={pending} name="lastName" value={lastName} onChange={event => setLastName(event.target.value)} label="Last Name" placeholder="Tui" required className="bg-surface-ocean border-border focus:border-lagoon" />
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
                    className="bg-surface-ocean border-border focus:border-lagoon"
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
