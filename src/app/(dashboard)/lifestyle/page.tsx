import { getActiveBlock, getMembersWithLogs } from "@/actions/data";
import { PageHeader } from "@/components/ui/Components";
import { Heart, TrendingUp, Award, CheckCircle, AlertCircle } from "lucide-react";

import { WeekSelector } from "@/components/shared/WeekSelector";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { LifestyleLogList } from "@/components/lifestyle/LifestyleLogList";
import { ExportButton } from "@/components/shared/ExportButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDecimal, formatInteger } from "@/lib/formatters";

export default async function LifestylePage({ searchParams }: { searchParams: { weekId?: string } }) {
    const block = await getActiveBlock();
    if (!block) return <div className="min-h-screen flex items-center justify-center p-6"><EmptyState icon={AlertCircle} title="No Active Block" description="There is no active competition block. Please create one from the admin settings." /></div>;

    const selectedWeekId = (await searchParams)?.weekId || block.weeks[0].id;
    const selectedWeek = block.weeks.find(w => w.id === selectedWeekId) || block.weeks[0];
    const members = await getMembersWithLogs(selectedWeek.id);

    // Calculate summary statistics
    const totalPosts = members.reduce((sum, m) => sum + (m.lifestyleLogs[0]?.postCount || 0), 0);
    const avgPosts = members.length > 0 ? totalPosts / members.length : 0;
    const mostActive = members.reduce((top, m) =>
        (m.lifestyleLogs[0]?.postCount || 0) > (top.lifestyleLogs[0]?.postCount || 0) ? m : top,
        members[0]
    );
    const engagement = members.length > 0 ? (members.filter(m => m.lifestyleLogs.length > 0).length / members.length) * 100 : 0;

    return (
        <div className="min-h-full pb-10">
            <PageHeader title="Lifestyle" subtitle="Healthy Habits">
                <WeekSelector
                    weeks={block.weeks.map((w) => ({
                        value: w.id,
                        label: `Week ${w.weekNumber}`
                    }))}
                    selectedWeekId={selectedWeekId}
                    basePath="/lifestyle"
                />
                <ExportButton blockId={block.id} type="lifestyle" />
            </PageHeader>

            {/* Summary Cards */}
            <div className="px-6 md:px-10 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard
                        icon={TrendingUp}
                        iconColor="text-tongan"
                        iconBg="bg-tongan/10"
                        label="Total Posts"
                        value={formatInteger(totalPosts)}
                        subtitle="Combined posts"
                    />
                    <SummaryCard
                        icon={Heart}
                        iconColor="text-pink-400"
                        iconBg="bg-pink-500/10"
                        label="Average Posts"
                        value={formatDecimal(avgPosts)}
                        subtitle="Per member"
                    />
                    <SummaryCard
                        icon={Award}
                        iconColor="text-lagoon-100"
                        iconBg="bg-lagoon/10"
                        label="Most Active"
                        value={mostActive ? `${mostActive.firstName} ${mostActive.lastName.charAt(0)}.` : 'N/A'}
                        subtitle={mostActive?.lifestyleLogs[0] ? `${mostActive.lifestyleLogs[0].postCount} posts` : ''}
                    />
                    <SummaryCard
                        icon={CheckCircle}
                        iconColor="text-green-400"
                        iconBg="bg-green-500/10"
                        label="Engagement"
                        value={`${engagement.toFixed(0)}%`}
                        subtitle={`${members.filter(m => m.lifestyleLogs.length > 0).length}/${members.length} posted`}
                    />
                </div>
            </div>

            <div className="px-6 md:px-10 mt-6">
                <LifestyleLogList members={members} weekId={selectedWeek.id} />
            </div>
        </div>
    );
}
