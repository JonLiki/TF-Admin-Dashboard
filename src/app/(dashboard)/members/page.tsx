import { PremiumCard } from "@/components/ui/PremiumCard";
import { Button, Input, PageHeader } from "@/components/ui/Components";
import { getMembers, getTeams, createMember } from "@/actions";
import { UserPlus } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { MembersList } from "@/components/members/MembersList";
import { OceanWaves } from "@/components/ui/Patterns";

export default async function MembersPage() {
    const members = await getMembers();
    const teams = await getTeams();

    return (
        <div className="min-h-full pb-10 relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
                <OceanWaves />
            </div>

            <PageHeader title="Members" subtitle="Member Management" />

            <div className="px-6 md:px-10 mt-6 grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
                {/* Create Member Form */}
                <div className="lg:col-span-1">
                    <PremiumCard className="p-6 sticky top-6 bg-ocean-deep/80 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden group">
                        {/* Decorative Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-lagoon/10 blur-[50px] rounded-full pointer-events-none -mr-10 -mt-10" />

                        <div className="flex items-center space-x-3 mb-6 relative z-10">
                            <div className="p-2.5 bg-gradient-to-br from-[#00A0D1] to-[#005F99] text-white rounded-xl shadow-lg shadow-lagoon/20 ring-1 ring-white/10">
                                <UserPlus className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-white tracking-tight">New Member</h3>
                        </div>

                        <form action={createMember} className="space-y-4 relative z-10">
                            <Input name="firstName" label="First Name" placeholder="Sione" required className="bg-black/20 border-white/10 focus:border-lagoon/50" />
                            <Input name="lastName" label="Last Name" placeholder="Tui" required className="bg-black/20 border-white/10 focus:border-lagoon/50" />
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Assign Group</label>
                                <Select
                                    options={[
                                        { value: '', label: 'No Group' },
                                        ...teams.map(t => ({ value: t.id, label: t.name }))
                                    ]}
                                    name="teamId"
                                    placeholder="Select a group"
                                    className="bg-black/20 border-white/10 focus:border-lagoon/50"
                                />
                            </div>
                            <Button type="submit" className="w-full mt-2 bg-lagoon hover:bg-lagoon-light text-white shadow-lagoon/20" size="md">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add Member
                            </Button>
                        </form>
                    </PremiumCard>
                </div>

                {/* Members List with Search and Filters */}
                <MembersList members={members} teams={teams} />
            </div>
        </div>
    );
}
