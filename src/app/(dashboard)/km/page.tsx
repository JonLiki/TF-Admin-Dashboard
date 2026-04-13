import { getActiveBlock, getMembersWithLogs } from "@/actions/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Activity, TrendingUp, Award, CheckCircle, AlertCircle } from "lucide-react";

import { SimpleWeekSelector } from "@/components/ui/SimpleWeekSelector";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { KmLogList } from "@/components/km/KmLogList";
import { BlockExportButton } from "@/components/ui/BlockExportButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatTwoDecimals } from "@/lib/formatters";

export default async function KmPage({ searchParams }: { searchParams: { weekId?: string } }) {
    const block = await getActiveBlock();
    if (!block) return <div className="min-h-screen flex items-center justify-center p-6"><EmptyState icon={AlertCircle} title="No Active Block" description="There is no active competition block. Please create one from the admin settings." /></div>;

    const selectedWeekId = (await searchParams)?.weekId || block.weeks[0].id;
    const selectedWeek = block.weeks.find(w => w.id === selectedWeekId) || block.weeks[0];
    const members = await getMembersWithLogs(selectedWeek.id);

    // Calculate summary statistics
    const totalKm = members.reduce((sum, m) => sum + (m.kmLogs[0]?.totalKm || 0), 0);
    const avgKm = members.length > 0 ? totalKm / members.length : 0;
    const topPerformer = members.reduce((top, m) =>
        (m.kmLogs[0]?.totalKm || 0) > (top.kmLogs[0]?.totalKm || 0) ? m : top,
        members[0]
    );
    const completionRate = members.length > 0 ? (members.filter(m => m.kmLogs.length > 0).length / members.length) * 100 : 0;

    return (
        <div className="min-h-full pb-10">
            <PageHeader title="Weekly KM" subtitle="Activity Logs">
                <SimpleWeekSelector
                    weeks={block.weeks.map((w) => ({
                        value: w.id,
                        label: `Week ${w.weekNumber}`
                    }))}
                    selectedWeekId={selectedWeekId}
                    basePath="/km"
                />
                <BlockExportButton blockId={block.id} type="km" />
            </PageHeader>

            {/* Summary Cards */}
            <div className="px-6 md:px-10 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard
                        icon={TrendingUp}
                        iconColor="text-lagoon-100"
                        iconBg="bg-lagoon/10"
                        label="Total KM"
                        value={formatTwoDecimals(totalKm)}
                        subtitle="Combined distance"
                    />
                    <SummaryCard
                        icon={Activity}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                        label="Average KM"
                        value={formatTwoDecimals(avgKm)}
                        subtitle="Per member"
                    />
                    <SummaryCard
                        icon={Award}
                        iconColor="text-tongan"
                        iconBg="bg-tongan/10"
                        label="Top Performer"
                        value={topPerformer ? `${topPerformer.firstName} ${topPerformer.lastName.charAt(0)}.` : 'N/A'}
                        subtitle={topPerformer?.kmLogs[0] ? `${formatTwoDecimals(topPerformer.kmLogs[0].totalKm)} km` : ''}
                    />
                    <SummaryCard
                        icon={CheckCircle}
                        iconColor="text-green-400"
                        iconBg="bg-green-500/10"
                        label="Completion"
                        value={`${completionRate.toFixed(0)}%`}
                        subtitle={`${members.filter(m => m.kmLogs.length > 0).length}/${members.length} logged`}
                    />
                </div>
            </div>

            <div className="px-6 md:px-10 mt-6">
                <KmLogList members={members} weekId={selectedWeek.id} />
            </div>
        </div>
    );
}
