import { getActiveBlock } from "@/actions/data";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Trophy, AlertCircle, User as UserIcon, Activity, Flame } from "lucide-react";
import { PremiumTrophy } from "@/components/ui/PremiumTrophy";
import prisma from "@/lib/prisma";
import { BlockWeek, Team, TeamWeekAward } from "@prisma/client";
import { MetricList } from "@/components/scoreboard/MetricList";
import { LeaderboardList } from "@/components/scoreboard/LeaderboardList";
import { Podium } from "@/components/scoreboard/Podium";
import { WinnerCard, AwardCategoryType } from "@/components/scoreboard/WinnerCard";
import { PerformanceTrendsChart } from "@/components/scoreboard/PerformanceTrendsChart";
import { getLeaderboardStandings, sortMetrics, getTrendData } from "@/lib/transformers/scoreboard";
import { TeamPoints } from "@/types/scoreboard";
import { EmptyState } from "@/components/ui/EmptyState";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function UserDashboardPage() {
    const session = await auth();
    if (!session || !session.user) {
        redirect('/login');
    }

    const memberId = (session.user as any).memberId;
    let memberData = null;
    let memberTeam = null;

    if (memberId) {
        memberData = await prisma.member.findUnique({
            where: { id: memberId },
            include: { team: true, weighIns: true, attendance: true }
        });
        if (memberData?.team) {
            memberTeam = memberData.team;
        }
    }

    const block = await getActiveBlock();
    if (!block) return <div className="min-h-screen flex items-center justify-center p-6"><EmptyState icon={AlertCircle} title="No Active Challenge" description="There is no active competition at the moment. Check back later." /></div>;

    const selectedWeek = block.weeks[block.weeks.length - 1]; // Default to latest week

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

    const teamPoints: TeamPoints[] = pointTotals.map(pt => ({
        teamId: pt.teamId,
        points: pt._sum.amount || 0
    }));

    const allTeams = await prisma.team.findMany();
    const overallLeaderboard = getLeaderboardStandings(allTeams, teamPoints);
    const sortedMetrics = sortMetrics(metrics);

    const allBlockMetrics = await prisma.teamWeekMetric.findMany({
        where: { blockWeek: { blockId: block.id } },
        include: { team: true, blockWeek: true },
        orderBy: { blockWeek: { weekNumber: 'asc' } }
    });
    const trendData = getTrendData(allBlockMetrics);
    const topTeamsForTrend = overallLeaderboard.map(t => t.name);

    return (
        <div className="min-h-full pb-10 pt-6">
            <PageHeader title="Challenger Dashboard" subtitle={memberTeam ? `Team ${memberTeam.name}` : "Welcome to the Challenge"} />

            <div className="px-6 md:px-10 mt-6 space-y-8">

                {/* PERSONAL STATS SECTION (ONLY VISIBLE IF MEMBER PROFILE LINKED) */}
                {memberData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <PremiumCard className="p-6 bg-gradient-to-br from-tongan/20 to-ocean-deep border-tongan/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-tongan/20 rounded-xl">
                                    <UserIcon className="w-6 h-6 text-tongan-light" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-tapa uppercase tracking-widest">Athlete</h3>
                                    <p className="text-xl font-black text-white">{memberData.firstName} {memberData.lastName}</p>
                                </div>
                            </div>
                        </PremiumCard>

                        <PremiumCard className="p-6 bg-gradient-to-br from-lagoon/20 to-ocean-deep border-lagoon/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-lagoon/20 rounded-xl">
                                    <Flame className="w-6 h-6 text-lagoon-100" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-tapa uppercase tracking-widest">Weigh-ins</h3>
                                    <p className="text-xl font-black text-white">{memberData.weighIns?.length || 0} Recorded</p>
                                </div>
                            </div>
                        </PremiumCard>

                        <PremiumCard className="p-6 bg-gradient-to-br from-sand/20 to-ocean-deep border-sand/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-sand/20 rounded-xl">
                                    <Activity className="w-6 h-6 text-sand" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-tapa uppercase tracking-widest">Attendance</h3>
                                    <p className="text-xl font-black text-white">{memberData.attendance?.filter(a => a.isPresent).length || 0} Sessions</p>
                                </div>
                            </div>
                        </PremiumCard>
                    </div>
                )}

                {/* OVERALL LEADERBOARD */}
                <PremiumCard className="relative overflow-hidden p-0">
                    <div className="p-8 relative z-10">
                        <div className="flex items-center space-x-4 mb-6 p-4 rounded-2xl bg-ocean-deep/40 backdrop-blur-md border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] relative group cursor-default">
                            <div className="absolute inset-0 bg-gradient-to-r from-tongan/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rounded-2xl pointer-events-none" />
                            <div className="relative p-3 bg-gradient-to-br from-tongan/20 to-transparent rounded-xl border border-tongan/30 shadow-[0_0_15px_rgba(200,16,46,0.15)] flex items-center justify-center">
                                <PremiumTrophy className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" variant="tongan" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Overall Standings</h2>
                                <p className="text-tongan-light text-[10px] font-bold tracking-[0.2em] uppercase mt-1 opacity-80">Block Leaderboard</p>
                            </div>
                        </div>

                        <Podium standings={overallLeaderboard.slice(0, 3)} />

                        <LeaderboardList
                            items={overallLeaderboard.slice(3)}
                            startIndex={3}
                            isPublic={true}
                        />
                    </div>
                </PremiumCard>

                <PerformanceTrendsChart
                    data={trendData}
                    teams={topTeamsForTrend.length > 0 ? topTeamsForTrend : allTeams.map(t => t.name)}
                />

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
            </div>
        </div>
    );
}
