import { PremiumCard } from "@/components/ui/PremiumCard";
import { Button, Input, PageHeader } from "@/components/ui/Components";
import { getTeams, createTeam } from "@/actions";
import { Plus, Shield } from "lucide-react";
import { TeamsList } from "@/components/teams/TeamsList";
import { TonganNgatu } from "@/components/ui/Patterns";

export default async function TeamsPage() {
    const teams = await getTeams();

    return (
        <div className="min-h-full pb-10 relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
                <TonganNgatu />
            </div>

            <PageHeader title="Teams" subtitle="Manage Groups" />

            <div className="px-6 md:px-10 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">

                {/* Create Team Form */}
                <div className="lg:col-span-1">
                    <PremiumCard className="p-6 sticky top-6 bg-ocean-deep/80 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden group">
                        {/* Decorative Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-tongan/10 blur-[50px] rounded-full pointer-events-none -mr-10 -mt-10" />

                        <div className="flex items-center space-x-3 mb-6 relative z-10">
                            <div className="p-2.5 bg-gradient-to-br from-[#C8102E] to-[#8B0000] text-white rounded-xl shadow-lg shadow-tongan/20 ring-1 ring-white/10">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Create New Group</h3>
                        </div>
                        <form action={createTeam} className="space-y-4 relative z-10">
                            <Input name="name" label="Group Name" placeholder="e.g. Group To’a" required className="bg-black/20 border-white/10 focus:border-tongan/50" />
                            <Button type="submit" className="w-full bg-tongan hover:bg-red-700 shadow-tongan/20" size="md">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Group
                            </Button>
                        </form>
                    </PremiumCard>
                </div>

                {/* Teams List with Search */}
                <TeamsList teams={teams} />
            </div>
        </div>
    );
}
