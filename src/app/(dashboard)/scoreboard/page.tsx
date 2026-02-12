/* eslint-disable @typescript-eslint/no-explicit-any */
import { getActiveBlock } from "@/actions/data";
import { calculateWeekResults } from "@/actions/scoring";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PageHeader } from "@/components/ui/Components";
import { Trophy } from "lucide-react";
import prisma from "@/lib/prisma";
import { BlockWeek, Team, TeamWeekAward } from "@prisma/client";
import { FinalizeWeekButton } from "@/components/ui/FinalizeWeekButton";
import { ExportButton } from "@/components/ui/ExportButton";
import { MetricList } from "@/components/scoreboard/MetricList";
import { LeaderboardList } from "@/components/scoreboard/LeaderboardList";
import { WeekSelector } from "@/components/ui/WeekSelector";
import { Podium } from "@/components/scoreboard/Podium";
import { WinnerCard } from "@/components/scoreboard/WinnerCard";
import { getLeaderboardStandings, sortMetrics } from "@/lib/transformers/scoreboard";
import { TeamPoints } from "@/types/scoreboard";

export default async function ScoreboardPage({ searchParams }: { searchParams: Promise<{ weekId?: string }> }) {
    const block = await getActiveBlock();
    if (!block) return <div>No active block found.</div>;

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

                    <FinalizeWeekButton
                        weekId={selectedWeekId}
                        onFinalize={async (weekId) => {
                            'use server';
                            await calculateWeekResults(weekId);
                        }}
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
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="p-3 bg-ocean/5 rounded-xl border border-ocean/10">
                                <Trophy className="w-8 h-8 text-tongan drop-shadow-sm" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold uppercase tracking-wide text-white">Overall Standings</h2>
                                <p className="text-offwhite/60 text-xs font-bold tracking-widest uppercase mt-1">Block Leaderboard</p>
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
                                    category={award.category as any}
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



