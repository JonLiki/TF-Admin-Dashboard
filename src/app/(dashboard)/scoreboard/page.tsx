import { getActiveBlock } from "@/actions/data";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Trophy, AlertCircle } from "lucide-react";
import { PremiumTrophy } from "@/components/ui/PremiumTrophy";
import prisma from "@/lib/prisma";
import { BlockWeek, Team, TeamWeekAward } from "@prisma/client";
import { FinalizeWeekWizard } from "@/components/scoreboard/FinalizeWeekWizard";
import { ExportButton } from "@/components/ui/ExportButton";
import { MetricList } from "@/components/scoreboard/MetricList";
import { LeaderboardList } from "@/components/scoreboard/LeaderboardList";
import { WeekSelector } from "@/components/ui/WeekSelector";
import { Podium } from "@/components/scoreboard/Podium";
import { WinnerCard, AwardCategoryType } from "@/components/scoreboard/WinnerCard";
import { PerformanceTrendsChart } from "@/components/scoreboard/PerformanceTrendsChart";
import { getLeaderboardStandings, sortMetrics, getTrendData } from "@/lib/transformers/scoreboard";
import { TeamPoints } from "@/types/scoreboard";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ScoreboardPage({ searchParams }: { searchParams: Promise<{ weekId?: string }> }) {
    const block = await getActiveBlock();
    if (!block) return <div className="min-h-screen flex items-center justify-center p-6"><EmptyState icon={AlertCircle} title="No Active Block" description="There is no active competition block. Please create one from the admin settings." /></div>;

    const resolvedParams = await searchParams;
    const selectedWeekId = resolvedParams?.weekId || block.weeks[0].id;
    const selectedWeek = block.weeks.find((w: BlockWeek) => w.id === selectedWeekId) || block.weeks[0];

    // ... (Data fetching logic)
    const metrics = await prisma.teamWeekMetric.findMany({
        where: { blockWeekId: selectedWeek.id },
        include: { team: true },
        orderBy: { team: { name: 'asc' } }
    });

    const awards = await prisma.teamWeekAward.findMany({
        where: { blockWeekId: selectedWeek.id },
        include: { team: true }
    });

    const pointTotals = await prisma.pointLedger.groupBy({
        by: ['teamId'],
        _sum: { amount: true }
    });

    // Transform Data
    const teamPoints: TeamPoints[] = pointTotals.map(pt => ({
        teamId: pt.teamId,
        points: pt._sum.amount || 0
    }));

    const allTeams = await prisma.team.findMany();
    const overallLeaderboard = getLeaderboardStandings(allTeams, teamPoints);
    const sortedMetrics = sortMetrics(metrics);

    // Trend Data
    const allBlockMetrics = await prisma.teamWeekMetric.findMany({
        where: { blockWeek: { blockId: block.id } },
        include: { team: true, blockWeek: true },
        orderBy: { blockWeek: { weekNumber: 'asc' } }
    });
    const trendData = getTrendData(allBlockMetrics);
    const topTeamsForTrend = overallLeaderboard.map(t => t.name);

    return (
        <div className="min-h-full pb-10">
            <PageHeader title="Scoreboard" subtitle={`Scoreboard • Week ${selectedWeek.weekNumber}`}>
                <div className="flex items-center gap-3">
                    <WeekSelector
                        weeks={block.weeks.map((w: BlockWeek) => ({
                            value: w.id,
                            label: `Week ${w.weekNumber}`
                        }))}
                        selectedWeekId={selectedWeekId}
                        basePath="/scoreboard"
                    />

                    <FinalizeWeekWizard
                        weekId={selectedWeekId}
                        weekNumber={selectedWeek.weekNumber}
                        isFinalized={selectedWeek.isFinalized || false}
                    />

                    <ExportButton
                        data={{
                            weekNumber: selectedWeek.weekNumber,
                            date: new Date().toLocaleDateString('en-NZ', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }),
                            standings: overallLeaderboard.map((team, index) => ({
                                rank: index + 1,
                                teamName: team.name,
                                totalPoints: team.points
                            })),
                            winners: awards.length > 0 ? {
                                weightLoss: awards.find((w) => w.category === 'WEIGHT_LOSS') ? {
                                    team: awards.find((w) => w.category === 'WEIGHT_LOSS')?.team.name || '',
                                    award: awards.find((w) => w.category === 'WEIGHT_LOSS')?.category || ''
                                } : undefined,
                                lifestyle: awards.find((w) => w.category === 'LIFESTYLE') ? {
                                    team: awards.find((w) => w.category === 'LIFESTYLE')?.team.name || '',
                                    award: awards.find((w) => w.category === 'LIFESTYLE')?.category || ''
                                } : undefined,
                                km: awards.find((w) => w.category === 'KM') ? {
                                    team: awards.find((w) => w.category === 'KM')?.team.name || '',
                                    award: awards.find((w) => w.category === 'KM')?.category || ''
                                } : undefined
                            } : undefined
                        }}
                    />
                </div>
            </PageHeader>

            <div className="px-6 md:px-10 mt-6 space-y-8">

                {/* OVERALL LEADERBOARD */}
                <PremiumCard className="relative overflow-hidden p-0">
                    <div className="p-8 relative z-10">
                        <div className="flex items-center space-x-4 mb-6 p-4 rounded-2xl bg-ocean-deep/40 backdrop-blur-md border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] relative group cursor-default">
                            {/* Inner Glow Map */}
                            <div className="absolute inset-0 bg-gradient-to-r from-tongan/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rounded-2xl pointer-events-none" />
                            
                            <div className="relative p-3 bg-gradient-to-br from-tongan/20 to-transparent rounded-xl border border-tongan/30 shadow-[0_0_15px_rgba(200,16,46,0.15)] flex items-center justify-center">
                                <PremiumTrophy className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" variant="tongan" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Overall Standings</h2>
                                <p className="text-tongan-light text-[10px] font-bold tracking-[0.2em] uppercase mt-1 opacity-80">Block Leaderboard</p>
                            </div>
                        </div>

                        {/* PODIUM LAYOUT */}
                        <Podium standings={overallLeaderboard.slice(0, 3)} />

                        {/* Remaining List (4th onwards) */}
                        <LeaderboardList
                            items={overallLeaderboard.slice(3)}
                            startIndex={3}
                        />
                    </div>
                </PremiumCard>

                {/* PERFORMANCE TRENDS CHART */}
                <PerformanceTrendsChart
                    data={trendData}
                    teams={topTeamsForTrend.length > 0 ? topTeamsForTrend : allTeams.map(t => t.name)}
                />

                {/* WEEKLY WINNERS CARDS */}
                {awards.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-tongan/10 rounded-lg border border-tongan/20">
                                <Trophy className="w-5 h-5 text-tongan" />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-wide">
                                Week {selectedWeek.weekNumber} Winners
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {awards.map((award: TeamWeekAward & { team: Team }) => (
                                <WinnerCard
                                    key={award.id}
                                    teamName={award.team.name}
                                    category={award.category as AwardCategoryType}
                                    weekNumber={selectedWeek.weekNumber}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* METRIC CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricList
                        title="KM Average"
                        theme="ocean"
                        items={sortedMetrics.km}
                        valueKey="kmAverage"
                        unit="km"
                        weekId={selectedWeek.id}
                    />
                    <MetricList
                        title="Weight Loss"
                        theme="tongan"
                        items={sortedMetrics.weight}
                        valueKey="weightLossTotal"
                        unit="kg"
                        weekId={selectedWeek.id}
                    />
                    <MetricList
                        title="Lifestyle Avg"
                        theme="lifestyle"
                        items={sortedMetrics.lifestyle}
                        valueKey="lifestyleAverage"
                        unit="pts"
                        weekId={selectedWeek.id}
                    />
                    <MetricList
                        title="Attendance Avg"
                        theme="attendance"
                        items={sortedMetrics.attendance}
                        valueKey="attendanceAverage"
                        unit="sess"
                        weekId={selectedWeek.id}
                    />
                </div>
            </div>
        </div>
    );
}



