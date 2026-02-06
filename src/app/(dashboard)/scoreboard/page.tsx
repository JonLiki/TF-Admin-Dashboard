/* eslint-disable @typescript-eslint/no-explicit-any */
import { getActiveBlock } from "@/actions/data";
import { calculateWeekResults } from "@/actions/scoring";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Button, PageHeader } from "@/components/ui/Components";
import { Trophy } from "lucide-react";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { BlockWeek, Team, TeamWeekAward, TeamWeekMetric } from "@prisma/client";
import ConfettiCelebration from "@/components/ui/ConfettiCelebration";
import { FinalizeWeekButton } from "@/components/ui/FinalizeWeekButton";
import { ExportButton } from "@/components/ui/ExportButton";
import { MetricList } from "@/components/scoreboard/MetricList";
import { LeaderboardList } from "@/components/scoreboard/LeaderboardList";
import { WeekSelector } from "@/components/ui/WeekSelector";

import { NgatuDivider, WinnerBadge, OceanWaves, TonganNgatu } from "@/components/ui/Patterns";
import { WinnerCard } from "@/components/scoreboard/WinnerCard";

export default async function ScoreboardPage({ searchParams }: { searchParams: { weekId?: string } }) {
    const block = await getActiveBlock();
    if (!block) return <div>No active block found.</div>;

    const selectedWeekId = (await searchParams)?.weekId || block.weeks[0].id;
    const selectedWeek = block.weeks.find((w: BlockWeek) => w.id === selectedWeekId) || block.weeks[0];

    // ... (Data fetching logic remains SAME)
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

    const teamTotalPoints = new Map<string, number>();
    pointTotals.forEach((pt: { teamId: string, _sum: { amount: number | null } }) => {
        teamTotalPoints.set(pt.teamId, pt._sum.amount || 0);
    });

    const kmSorted = [...metrics].sort((a: TeamWeekMetric, b: TeamWeekMetric) => (b.kmAverage || 0) - (a.kmAverage || 0));
    const weightSorted = [...metrics].sort((a: TeamWeekMetric, b: TeamWeekMetric) => (b.weightLossTotal || 0) - (a.weightLossTotal || 0));
    const lifestyleSorted = [...metrics].sort((a: TeamWeekMetric, b: TeamWeekMetric) => (b.lifestyleAverage || 0) - (a.lifestyleAverage || 0));
    const attendanceSorted = [...metrics].sort((a: TeamWeekMetric, b: TeamWeekMetric) => (b.attendanceAverage || 0) - (a.attendanceAverage || 0));

    const allTeams = await prisma.team.findMany();
    const overallLeaderboard = allTeams.map((t: Team) => ({
        name: t.name,
        points: teamTotalPoints.get(t.id) || 0,
        id: t.id
    })).sort((a: { points: number }, b: { points: number }) => b.points - a.points);


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
                            standings: overallLeaderboard.map((team: { name: string; points: number }, index) => ({
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
                        <div className="flex flex-col md:flex-row items-end justify-center gap-4 min-h-[380px] mb-12 mt-8">

                            {/* 2nd Place */}
                            {overallLeaderboard[1] && (
                                <div className="order-2 md:order-1 flex-1 max-w-[200px] flex flex-col items-center">
                                    <div className="mb-3 text-center">
                                        <span className="text-lg font-bold text-white block truncate w-full px-2">{overallLeaderboard[1].name}</span>
                                        <span className="text-xl font-mono font-bold text-lagoon-100">{overallLeaderboard[1].points} pts</span>
                                    </div>
                                    <div className="w-full h-40 bg-gradient-to-t from-ocean-deep via-ocean to-lagoon/20 border-t-2 border-x border-lagoon/30 rounded-t-lg relative group overflow-hidden shadow-[0_0_20px_rgba(28,114,147,0.15)]">
                                        <OceanWaves className="absolute inset-0 opacity-10" />
                                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-lagoon to-transparent" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-6xl font-black text-lagoon/20 group-hover:text-lagoon/40 transition-colors drop-shadow-lg">2</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 1st Place (Winner) */}
                            {overallLeaderboard[0] && (
                                <div className="order-1 md:order-2 flex-1 max-w-[240px] flex flex-col items-center z-10 -mx-2 md:mx-4">
                                    <div className="mb-6 text-center relative w-full">
                                        {/* God Ray / Spotlight Effect */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-tongan/20 blur-[80px] -z-10 rounded-full" />

                                        <WinnerBadge className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-28 animate-pulse-slow drop-shadow-[0_0_15px_rgba(200,16,46,0.5)]" />
                                        <div className="mt-12">
                                            <span className="text-2xl font-black text-white uppercase tracking-wider block drop-shadow-md">{overallLeaderboard[0].name}</span>
                                            <span className="text-4xl font-mono font-black text-tongan drop-shadow-[0_0_10px_rgba(200,16,46,0.4)]">{overallLeaderboard[0].points} pts</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-56 bg-gradient-to-t from-tongan-dark via-tongan to-tongan/20 border-t-4 border-x border-tongan rounded-t-xl relative group overflow-hidden shadow-[0_0_50px_rgba(200,16,46,0.3)]">
                                        <TonganNgatu className="absolute inset-0 opacity-10" />
                                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-tongan-light via-white to-tongan-light opacity-50" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Trophy className="w-24 h-24 text-tongan-offwhite/20 group-hover:text-tongan-offwhite/40 group-hover:scale-110 transition-all duration-700" />
                                        </div>
                                        <div className="absolute bottom-6 left-0 right-0 text-center">
                                            <span className="px-4 py-1 bg-tongan-dark/80 backdrop-blur-sm border border-tongan-light/30 rounded-full text-xs font-bold text-white uppercase tracking-[0.2em] shadow-lg">
                                                Leader
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {overallLeaderboard[2] && (
                                <div className="order-3 md:order-3 flex-1 max-w-[200px] flex flex-col items-center">
                                    <div className="mb-3 text-center">
                                        <span className="text-lg font-bold text-white block truncate w-full px-2">{overallLeaderboard[2].name}</span>
                                        <span className="text-xl font-mono font-bold text-slate-400">{overallLeaderboard[2].points} pts</span>
                                    </div>
                                    <div className="w-full h-32 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-700/30 border-t-2 border-x border-slate-600/30 rounded-t-lg relative group overflow-hidden shadow-[0_0_20px_rgba(148,163,184,0.1)]">
                                        <NgatuDivider className="absolute bottom-0 w-full opacity-5" />
                                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-slate-500 to-transparent" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-6xl font-black text-slate-500/20 group-hover:text-slate-500/40 transition-colors">3</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

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
                        items={kmSorted}
                        valueKey="kmAverage"
                        unit="km"
                        weekId={selectedWeek.id}
                    />
                    <MetricList
                        title="Weight Loss"
                        theme="tongan"
                        items={weightSorted}
                        valueKey="weightLossTotal"
                        unit="kg"
                        weekId={selectedWeek.id}
                    />
                    <MetricList
                        title="Lifestyle Avg"
                        theme="lifestyle"
                        items={lifestyleSorted}
                        valueKey="lifestyleAverage"
                        unit="pts"
                        weekId={selectedWeek.id}
                    />
                    <MetricList
                        title="Attendance Avg"
                        theme="attendance"
                        items={attendanceSorted}
                        valueKey="attendanceAverage"
                        unit="sess"
                        weekId={selectedWeek.id}
                    />
                </div>
            </div>
        </div>
    );
}



