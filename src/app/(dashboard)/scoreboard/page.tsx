import { format } from "date-fns";
import { getActiveBlock } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Trophy, AlertCircle } from "lucide-react";
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
import { ScoringRulesPanel } from "@/components/scoreboard/ScoringRulesPanel";

export default async function ScoreboardPage({ searchParams }: { searchParams: Promise<{ weekId?: string }> }) {
    const block = await getActiveBlock();
    if (!block) return <div className="min-h-screen flex items-center justify-center p-6"><EmptyState icon={AlertCircle} title="No Active Block" description="Create or activate a training block to start tracking." actionLabel="Manage blocks" actionHref="/blocks" /></div>;

    const resolvedParams = await searchParams;
    const today = new Date();
    const defaultWeek = block.weeks.find((week: BlockWeek) => today >= week.startDate && today <= week.endDate) ?? block.weeks[0];
    const selectedWeek = block.weeks.find((week: BlockWeek) => week.id === resolvedParams?.weekId) ?? defaultWeek;
    const selectedWeekId = selectedWeek.id;

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
        where: { blockId: block.id },
        _sum: { amount: true }
    });

    // Transform Data
    const teamPoints: TeamPoints[] = pointTotals.map(pt => ({
        teamId: pt.teamId,
        points: pt._sum?.amount || 0
    }));

    const allTeams = await prisma.team.findMany();
    const sortedMetrics = sortMetrics(metrics);

    // Block-wide metrics, used both for the trend chart and to break
    // overall-standings points ties by average category rank.
    const allBlockMetrics = await prisma.teamWeekMetric.findMany({
        where: { blockWeek: { blockId: block.id } },
        include: { team: true, blockWeek: true },
        orderBy: { blockWeek: { weekNumber: 'asc' } }
    });
    const overallLeaderboard = getLeaderboardStandings(allTeams, teamPoints, allBlockMetrics);
    const trendData = getTrendData(allBlockMetrics);
    const topTeamsForTrend = overallLeaderboard.map(t => t.name);

    return (
        <div className="min-h-full pb-10">
            <PageHeader title="Scoreboard" subtitle={`Scoreboard • Week ${selectedWeek.weekNumber}`}>
                <div className="flex flex-wrap items-center gap-3">
                    <WeekSelector
                        weeks={block.weeks.map((w: BlockWeek) => ({
                            value: w.id,
                            label: `Week ${w.weekNumber} · ${format(w.startDate, 'MMM d')}–${format(w.endDate, 'MMM d')} · ${w.isFinalized ? 'Finalized' : 'Open'}`
                        }))}
                        selectedWeekId={selectedWeekId}
                        basePath="/scoreboard"
                    />

                    <FinalizeWeekWizard key={selectedWeekId}
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
                                lifestyle: awards.find((w) => w.category === 'LIFESTYLE_AVG') ? {
                                    team: awards.find((w) => w.category === 'LIFESTYLE_AVG')?.team.name || '',
                                    award: awards.find((w) => w.category === 'LIFESTYLE_AVG')?.category || ''
                                } : undefined,
                                km: awards.find((w) => w.category === 'KM_AVG') ? {
                                    team: awards.find((w) => w.category === 'KM_AVG')?.team.name || '',
                                    award: awards.find((w) => w.category === 'KM_AVG')?.category || ''
                                } : undefined
                            } : undefined
                        }}
                    />
                </div>
            </PageHeader>

            <div className="px-4 sm:px-6 md:px-10 mt-6 space-y-8">
                <p role="status" className="rounded-xl border border-border bg-surface-ocean p-4 text-sm">
                    Week {selectedWeek.weekNumber}: {selectedWeek.isFinalized ? 'Finalized — entries are locked.' : 'Open — weekly results can change until finalized.'} Overall standings include points recorded across the block.
                </p>
                <section aria-labelledby="overall-standings-heading" className="rounded-xl border border-border bg-surface-ocean p-4 sm:p-6">
                    <h2 id="overall-standings-heading" className="text-xl font-bold">Overall block standings</h2>
                    <p className="mt-1 text-sm text-foreground/70">{block.name} &middot; Points across all weeks. The week selector changes weekly results below.</p>
                    <div className="overflow-auto"><table className="w-full text-left text-sm">
                        <caption className="py-3 text-left">Overall block standings. Equal points follow the scoring engine&apos;s category-rank tie-break order.</caption>
                        <thead><tr><th scope="col" className="p-2">Position</th><th scope="col" className="p-2">Team</th><th scope="col" className="p-2">Points</th></tr></thead>
                        <tbody>{overallLeaderboard.map((team, index) => <tr key={team.id} className="border-t border-border"><td className="p-2">{index + 1}</td><td className="p-2">{team.name}</td><td className="p-2 tabular-nums">{team.points}</td></tr>)}</tbody>
                    </table></div>
                    <details className="mt-4 border-t border-border pt-3">
                        <summary className="flex min-h-11 cursor-pointer items-center font-semibold focus-visible:outline-2 focus-visible:outline-lagoon">Show podium presentation</summary>
                        <div className="mt-4"><Podium standings={overallLeaderboard.slice(0, 3)} /><LeaderboardList items={overallLeaderboard.slice(3)} startIndex={3} /></div>
                    </details>
                </section>

                <section aria-labelledby="weekly-results-heading" className="space-y-6">
                    <div><h2 id="weekly-results-heading" className="text-xl font-bold">Weekly results &middot; Week {selectedWeek.weekNumber}</h2><p className="mt-1 text-sm text-foreground/70">{format(selectedWeek.startDate, 'd MMM')} to {format(selectedWeek.endDate, 'd MMM')} &middot; {selectedWeek.isFinalized ? 'Finalized results' : 'Provisional results until finalized'}</p></div>
                {/* WEEKLY WINNERS CARDS */}
                {awards.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-tongan/10 rounded-lg border border-tongan/20">
                                <Trophy className="w-5 h-5 text-tongan" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground tracking-wide">
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

                {!awards.length && <p className="text-sm text-foreground/70">No awards recorded for this week yet. Finalizing the week calculates results and locks entries.</p>}
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
                </section>

                <ScoringRulesPanel />

                {/* PERFORMANCE TRENDS CHART */}
                <PerformanceTrendsChart
                    data={trendData}
                    teams={topTeamsForTrend.length > 0 ? topTeamsForTrend : allTeams.map(t => t.name)}
                />


            </div>
        </div>
    );
}



