import { getActiveBlock } from "@/actions/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dumbbell, Award, CheckCircle, AlertCircle, Activity, TrendingUp } from "lucide-react";

import { SimpleWeekSelector } from "@/components/ui/SimpleWeekSelector";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { BenchmarkLogList } from "@/components/benchmarks/BenchmarkLogList";
import { BenchmarkLeaderboard } from "@/components/benchmarks/BenchmarkLeaderboard";
import { BenchmarkCategoryChart } from "@/components/benchmarks/BenchmarkCategoryChart";
import { BlockExportButton } from "@/components/ui/BlockExportButton";
import { EmptyState } from "@/components/ui/EmptyState";
import prisma from "@/lib/prisma";

// Server action to fetch cumulative benchmark data across all weeks in the active block
async function getCumulativeBenchmarks(blockId: string) {
    const allLogs = await prisma.benchmarkLog.findMany({
        where: {
            blockWeek: { blockId }
        },
        include: {
            member: {
                include: { team: true }
            },
            blockWeek: true
        }
    });

    // Aggregate per member across all weeks
    const memberMap = new Map<string, {
        name: string;
        initials: string;
        teamName: string;
        squats: number;
        pushups: number;
        burpees: number;
    }>();

    allLogs.forEach(log => {
        const memberId = log.memberId;
        const existing = memberMap.get(memberId);
        if (existing) {
            existing.squats += log.squats;
            existing.pushups += log.pushups;
            existing.burpees += log.burpees;
        } else {
            memberMap.set(memberId, {
                name: `${log.member.firstName} ${log.member.lastName}`,
                initials: `${log.member.firstName[0]}${log.member.lastName[0]}`,
                teamName: log.member.team?.name || 'Unassigned',
                squats: log.squats,
                pushups: log.pushups,
                burpees: log.burpees,
            });
        }
    });

    // Convert to sorted arrays
    const entries = Array.from(memberMap.values()).map(m => ({
        ...m,
        totalReps: m.squats + m.pushups + m.burpees,
    }));

    // Leaderboard: top 5 by total reps
    const leaderboard = [...entries]
        .sort((a, b) => b.totalReps - a.totalReps)
        .slice(0, 5);

    // Category tops: top 5 per exercise
    const squatsTop = [...entries]
        .filter(e => e.squats > 0)
        .sort((a, b) => b.squats - a.squats)
        .slice(0, 5)
        .map(e => ({ name: e.name.split(' ')[0] + ' ' + e.name.split(' ')[1]?.[0] + '.', value: e.squats }));

    const pushupsTop = [...entries]
        .filter(e => e.pushups > 0)
        .sort((a, b) => b.pushups - a.pushups)
        .slice(0, 5)
        .map(e => ({ name: e.name.split(' ')[0] + ' ' + e.name.split(' ')[1]?.[0] + '.', value: e.pushups }));

    const burpeesTop = [...entries]
        .filter(e => e.burpees > 0)
        .sort((a, b) => b.burpees - a.burpees)
        .slice(0, 5)
        .map(e => ({ name: e.name.split(' ')[0] + ' ' + e.name.split(' ')[1]?.[0] + '.', value: e.burpees }));

    // Total aggregate stats
    const totalSquats = entries.reduce((sum, e) => sum + e.squats, 0);
    const totalPushups = entries.reduce((sum, e) => sum + e.pushups, 0);
    const totalBurpees = entries.reduce((sum, e) => sum + e.burpees, 0);
    const participantCount = entries.filter(e => e.totalReps > 0).length;

    return {
        leaderboard,
        squatsTop,
        pushupsTop,
        burpeesTop,
        totalSquats,
        totalPushups,
        totalBurpees,
        participantCount,
    };
}

// Server action to get members with logs for a specific week (for the log entry form)
async function getMembersWithLogs(blockWeekId: string) {
    return await prisma.member.findMany({
        where: { isActive: true },
        include: {
            team: true,
            benchmarkLogs: { where: { blockWeekId } }
        },
        orderBy: { lastName: 'asc' }
    });
}

export default async function BenchmarksPage({ searchParams }: { searchParams: { weekId?: string } }) {
    const block = await getActiveBlock();
    if (!block) return <div className="min-h-screen flex items-center justify-center p-6"><EmptyState icon={AlertCircle} title="No Active Block" description="There is no active competition block. Please create one from the admin settings." /></div>;

    const selectedWeekId = (await searchParams)?.weekId || block.weeks[0].id;
    const selectedWeek = block.weeks.find(w => w.id === selectedWeekId) || block.weeks[0];

    // Fetch week-specific data for entry form + cumulative data for analytics
    const [members, cumulative] = await Promise.all([
        getMembersWithLogs(selectedWeek.id),
        getCumulativeBenchmarks(block.id),
    ]);

    // Per-week summary statistics (for the summary cards at top)
    let weekSquats = 0;
    let weekPushups = 0;
    let weekBurpees = 0;
    let loggedMembers = 0;

    members.forEach(m => {
        const log = m.benchmarkLogs?.[0];
        if (log && (log.squats > 0 || log.pushups > 0 || log.burpees > 0)) {
            weekSquats += log.squats;
            weekPushups += log.pushups;
            weekBurpees += log.burpees;
            loggedMembers++;
        }
    });

    const completionRate = members.length > 0 ? (loggedMembers / members.length) * 100 : 0;
    const totalWeekReps = weekSquats + weekPushups + weekBurpees;
    const totalCumulativeReps = cumulative.totalSquats + cumulative.totalPushups + cumulative.totalBurpees;

    // Top performer for this week
    const topPerformer = members.reduce((top, m) => {
        const mLog = m.benchmarkLogs?.[0];
        const topLog = top?.benchmarkLogs?.[0];
        const mTotal = mLog ? mLog.squats + mLog.pushups + mLog.burpees : 0;
        const topTotal = topLog ? topLog.squats + topLog.pushups + topLog.burpees : 0;
        return mTotal > topTotal ? m : top;
    }, members[0]);

    return (
        <div className="min-h-full pb-10">
            <PageHeader title="Benchmarks" subtitle="Weekly Workout Progress">
                <SimpleWeekSelector
                    weeks={block.weeks.map((w) => ({
                        value: w.id,
                        label: `Week ${w.weekNumber}`
                    }))}
                    selectedWeekId={selectedWeekId}
                    basePath="/benchmarks"
                />
                <BlockExportButton blockId={block.id} type="benchmarks" />
            </PageHeader>

            {/* Summary Cards */}
            <div className="px-6 md:px-10 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard
                        icon={Activity}
                        iconColor="text-lagoon-100"
                        iconBg="bg-lagoon/10"
                        label="Week Reps"
                        value={totalWeekReps.toLocaleString()}
                        subtitle={`Wk ${selectedWeek.weekNumber} combined`}
                    />
                    <SummaryCard
                        icon={TrendingUp}
                        iconColor="text-emerald-400"
                        iconBg="bg-emerald-500/10"
                        label="Block Total"
                        value={totalCumulativeReps.toLocaleString()}
                        subtitle={`${cumulative.participantCount} participants`}
                    />
                    <SummaryCard
                        icon={Award}
                        iconColor="text-tongan"
                        iconBg="bg-tongan/10"
                        label="Top Volume"
                        value={topPerformer ? `${topPerformer.firstName} ${topPerformer.lastName.charAt(0)}.` : 'N/A'}
                        subtitle={topPerformer?.benchmarkLogs?.[0] ? `${topPerformer.benchmarkLogs[0].squats + topPerformer.benchmarkLogs[0].pushups + topPerformer.benchmarkLogs[0].burpees} Reps this week` : ''}
                    />
                    <SummaryCard
                        icon={CheckCircle}
                        iconColor="text-green-400"
                        iconBg="bg-green-500/10"
                        label="Completion"
                        value={`${completionRate.toFixed(0)}%`}
                        subtitle={`${loggedMembers}/${members.length} logged`}
                    />
                </div>
            </div>

            {/* Visual Analytics Section */}
            {cumulative.leaderboard.length > 0 && (
                <div className="px-6 md:px-10 mt-8 space-y-6">
                    {/* Leaderboard + Category Charts side by side on large screens */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <BenchmarkLeaderboard entries={cumulative.leaderboard} />
                        <BenchmarkCategoryChart
                            squatsTop={cumulative.squatsTop}
                            pushupsTop={cumulative.pushupsTop}
                            burpeesTop={cumulative.burpeesTop}
                        />
                    </div>
                </div>
            )}

            {/* Data Entry Form */}
            <div className="px-6 md:px-10 mt-6">
                <BenchmarkLogList
                    members={members}
                    weekId={selectedWeek.id}
                    dateStr={selectedWeek.startDate.toISOString()}
                />
            </div>
        </div>
    );
}
