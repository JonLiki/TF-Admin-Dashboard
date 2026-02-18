import { getActiveBlock, getMembersWithWeighIn } from "@/actions/data";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Button, PageHeader } from "@/components/ui/Components";
import { Scale, Award, CheckCircle, Users } from "lucide-react";
import { format } from "date-fns";
import { DateSelector } from "@/components/shared/DateSelector";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { WeighInLogList } from "@/components/weigh-in/WeighInLogList";
import { ExportButton } from "@/components/shared/ExportButton";

export default async function WeighInPage({ searchParams }: { searchParams: { date?: string } }) {
    const block = await getActiveBlock();
    if (!block) return <div className="min-h-screen flex items-center justify-center text-slate-400">No active block found.</div>;

    const selectedDateStr = (await searchParams)?.date || block.weeks[0].startDate.toISOString();
    const selectedDate = new Date(selectedDateStr);
    const members = await getMembersWithWeighIn(selectedDate);

    // Calculate summary statistics
    // Note: WeighIn only has weight field, not startWeight/currentWeight
    // We'll show participation stats instead of weight loss for now
    const totalRecorded = members.filter(m => m.weighIns.length > 0).length;
    const avgWeight = members.length > 0 ? members.reduce((sum, m) => sum + (m.weighIns[0]?.weight || 0), 0) / totalRecorded : 0;
    const participation = members.length > 0 ? (totalRecorded / members.length) * 100 : 0;

    return (
        <div className="min-h-full pb-10">
            <PageHeader title="Weigh-in" subtitle="Weekly Weigh-ins">
                <DateSelector
                    dates={[
                        ...block.weeks.map((w) => ({
                            value: w.startDate.toISOString(),
                            label: `Week ${w.weekNumber} - ${format(w.startDate, 'MMM d')}`
                        })),
                        {
                            value: block.endDate.toISOString(),
                            label: `Final - ${format(block.endDate, 'MMM d')}`
                        }
                    ]}
                    selectedDate={selectedDateStr}
                />
                <ExportButton blockId={block.id} type="weigh-in" />
            </PageHeader>

            {/* Summary Cards */}
            <div className="px-6 md:px-10 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard
                        icon={Users}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                        label="Total Members"
                        value={members.length}
                        subtitle="In competition"
                    />
                    <SummaryCard
                        icon={CheckCircle}
                        iconColor="text-green-400"
                        iconBg="bg-green-500/10"
                        label="Recorded"
                        value={totalRecorded}
                        subtitle="Weighed in today"
                    />
                    <SummaryCard
                        icon={Scale}
                        iconColor="text-lagoon-100"
                        iconBg="bg-lagoon/10"
                        label="Avg Weight"
                        value={avgWeight > 0 ? `${avgWeight.toFixed(1)} kg` : 'N/A'}
                        subtitle="Of recorded members"
                    />
                    <SummaryCard
                        icon={Award}
                        iconColor="text-tongan"
                        iconBg="bg-tongan/10"
                        label="Participation"
                        value={`${participation.toFixed(0)}%`}
                        subtitle={`${totalRecorded}/${members.length} logged`}
                    />
                </div>
            </div>

            <div className="px-6 md:px-10 mt-6 md:mt-10">
                <WeighInLogList members={members} dateStr={selectedDateStr} />
            </div>
        </div>
    );
}
