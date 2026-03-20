import { getActiveBlock, getMembersWithWeighIn } from "@/actions/data";

import { PageHeader } from "@/components/ui/PageHeader";
import { Scale, Award, CheckCircle, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { DateSelector } from "@/components/ui/DateSelector";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { WeighInLogList } from "@/components/weigh-in/WeighInLogList";
import { BlockExportButton } from "@/components/ui/BlockExportButton";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function WeighInPage({ searchParams }: { searchParams: { date?: string } }) {
    const block = await getActiveBlock();
    if (!block) return <div className="min-h-screen flex items-center justify-center p-6"><EmptyState icon={AlertCircle} title="No Active Block" description="There is no active competition block. Please create one from the admin settings." /></div>;

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
                        // First week's startDate is the baseline "Start" weigh-in (Jan 19)
                        {
                            value: block.weeks[0].startDate.toISOString(),
                            label: `Start – ${format(block.weeks[0].startDate, 'MMM d')}`
                        },
                        // Weeks 2–N: each week's startDate is the "end-of-prior-week" weigh-in date
                        // e.g. Jan 26 = end of Week 1 / used to calculate Week 1 loss
                        ...block.weeks.slice(1).map((w) => ({
                            value: w.startDate.toISOString(),
                            label: `Week ${w.weekNumber - 1} End – ${format(w.startDate, 'MMM d')}`
                        })),
                        // Final weigh-in: block endDate (e.g. Mar 16) = end of last week
                        {
                            value: block.endDate.toISOString(),
                            label: `Week ${block.weeks.length} End – ${format(block.endDate, 'MMM d')}`
                        }
                    ]}
                    selectedDate={selectedDateStr}
                />
                <BlockExportButton blockId={block.id} type="weigh-in" />
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
