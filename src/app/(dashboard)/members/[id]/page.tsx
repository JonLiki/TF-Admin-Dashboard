
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Activity, Scale, CalendarDays, Trophy, Dumbbell } from "lucide-react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import MemberWeightChart from "@/components/analytics/MemberWeightChart";
import { BenchmarkProgressChart } from "@/components/user/BenchmarkProgressChart";
import { MemberActions } from "@/components/members/MemberActions";
import { MemberWeeklyTable } from "@/components/analytics/MemberWeeklyTable";
import { getActiveBlock } from "@/actions/data";
import { cn } from "@/lib/utils";

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch active block to get week definitions
    const block = await getActiveBlock();

    const member = await prisma.member.findUnique({
        where: { id },
        include: {
            team: true,
            weighIns: { orderBy: { date: 'asc' } },
            attendance: { orderBy: { session: { date: 'desc' } }, include: { session: true } },
            kmLogs: { include: { blockWeek: true } },
            lifestyleLogs: { include: { blockWeek: true } },
            benchmarkLogs: {
                include: { blockWeek: true },
                orderBy: { blockWeek: { weekNumber: 'asc' } }
            }
        }
    });

    if (!member) return <div>Member not found</div>;

    // Stats Logic
    const totalKm = member.kmLogs.reduce((acc, log) => acc + log.totalKm, 0);
    const totalSessions = member.attendance.filter(a => a.isPresent).length;
    const totalLifestyle = member.lifestyleLogs.reduce((acc, log) => acc + log.postCount, 0);

    const startWeight = member.weighIns[0]?.weight;
    const currentWeight = member.weighIns[member.weighIns.length - 1]?.weight;
    const totalLoss = startWeight && currentWeight ? (startWeight - currentWeight) : 0;

    // Benchmark totals (cumulative across active block)
    const blockWeekIds = block ? new Set(block.weeks.map(w => w.id)) : new Set<string>();
    const blockBenchmarks = member.benchmarkLogs.filter(l => blockWeekIds.has(l.blockWeekId));
    const totalBenchmarkReps = blockBenchmarks.reduce((acc, log) => acc + log.squats + log.pushups + log.burpees, 0);
    const totalSquats = blockBenchmarks.reduce((acc, log) => acc + log.squats, 0);
    const totalPushups = blockBenchmarks.reduce((acc, log) => acc + log.pushups, 0);
    const totalBurpees = blockBenchmarks.reduce((acc, log) => acc + log.burpees, 0);

    // Chart Data
    const weightData = member.weighIns.map(w => ({
        date: w.date.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' }),
        weight: w.weight
    }));

    // Benchmark chart data (active block only)
    const benchmarkChartData = blockBenchmarks.map(log => ({
        blockWeek: {
            weekNumber: log.blockWeek.weekNumber,
        },
        squats: log.squats,
        pushups: log.pushups,
        burpees: log.burpees,
    }));

    // Weekly Table Data Logic
    const weeklyStats = block?.weeks.map(week => {
        // Find logs for this week
        const kmLog = member.kmLogs.find(l => l.blockWeekId === week.id);
        const lifestyleLog = member.lifestyleLogs.find(l => l.blockWeekId === week.id);
        const benchmarkLog = member.benchmarkLogs.find(l => l.blockWeekId === week.id);

        const weighIn = member.weighIns.find(w =>
            w.date >= week.startDate && w.date <= week.endDate
        );

        // Attendance for this week
        const sessionsThisWeek = block.sessions.filter(s => s.date >= week.startDate && s.date < week.endDate);
        const attendedCount = member.attendance.filter(a =>
            a.isPresent && sessionsThisWeek.some(s => s.id === a.sessionId)
        ).length;

        return {
            weekNumber: week.weekNumber,
            weekLabel: `Week ${week.weekNumber}`,
            isCurrent: false,
            weight: weighIn?.weight,
            weightLoss: undefined as number | undefined,
            km: kmLog?.totalKm,
            lifestylePosts: lifestyleLog?.postCount,
            attendance: {
                present: attendedCount,
                total: sessionsThisWeek.length
            },
            benchmarks: benchmarkLog ? {
                squats: benchmarkLog.squats,
                pushups: benchmarkLog.pushups,
                burpees: benchmarkLog.burpees,
            } : undefined,
        };
    }) || [];

    // Post-process for Weekly Loss
    const processedStats = weeklyStats.map((stat, index) => {
        let loss = 0;
        const currentWeight = stat.weight;

        // Find previous valid weight
        let prevWeight: number | undefined = startWeight;
        if (index > 0) {
            for (let i = index - 1; i >= 0; i--) {
                if (weeklyStats[i].weight) {
                    prevWeight = weeklyStats[i].weight;
                    break;
                }
            }
        }

        if (currentWeight !== undefined && prevWeight !== undefined) {
            if (index === 0) {
                loss = 0;
            } else {
                loss = prevWeight - currentWeight;
            }
        }

        return {
            ...stat,
            weightLoss: (stat.weight && index > 0) ? loss : undefined
        };
    });

    return (
        <div className="min-h-full pb-10">
            <div className="mb-6 flex items-center justify-between">
                <Link href="/members">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Members
                    </Button>
                </Link>

                <MemberActions memberId={member.id} isActive={member.isActive} />
            </div>

            <PageHeader title={`${member.firstName} ${member.lastName}`} subtitle={member.team?.name || "Unassigned"}>
                {!member.isActive && <span className="bg-destructive/10 text-destructive px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Inactive</span>}
            </PageHeader>

            <div className="px-6 md:px-10 mt-6 space-y-8">
                {/* HEADLINE STATS */}
                <div className={cn(
                    "grid grid-cols-1 gap-4",
                    totalBenchmarkReps > 0 ? "md:grid-cols-5" : "md:grid-cols-4"
                )}>
                    <PremiumCard className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <div>
                                <p className="text-xs font-bold uppercase opacity-70 text-blue-900 dark:text-blue-100">Total KM</p>
                                <p className="text-xl font-mono font-bold text-blue-950 dark:text-blue-50">{totalKm.toFixed(1)} <span className="text-sm">km</span></p>
                            </div>
                        </div>
                    </PremiumCard>
                    <PremiumCard className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/50">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <div>
                                <p className="text-xs font-bold uppercase opacity-70 text-purple-900 dark:text-purple-100">Sessions</p>
                                <p className="text-xl font-mono font-bold text-purple-950 dark:text-purple-50">{totalSessions}</p>
                            </div>
                        </div>
                    </PremiumCard>
                    <PremiumCard className="p-4 bg-pink-50/50 dark:bg-pink-950/20 border-pink-100 dark:border-pink-900/50">
                        <div className="flex items-center gap-3">
                            <Trophy className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                            <div>
                                <p className="text-xs font-bold uppercase opacity-70 text-pink-900 dark:text-pink-100">Lifestyle</p>
                                <p className="text-xl font-mono font-bold text-pink-950 dark:text-pink-50">{totalLifestyle}</p>
                            </div>
                        </div>
                    </PremiumCard>
                    <PremiumCard className="p-4 bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50">
                        <div className="flex items-center gap-3">
                            <Scale className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <div>
                                <p className="text-xs font-bold uppercase opacity-70 text-red-900 dark:text-red-100">Weight Loss</p>
                                <p className="text-xl font-mono font-bold text-red-950 dark:text-red-50">{totalLoss > 0 ? totalLoss.toFixed(1) : "0.0"} <span className="text-sm">kg</span></p>
                            </div>
                        </div>
                    </PremiumCard>

                    {/* Benchmark Stat Card - only when data exists */}
                    {totalBenchmarkReps > 0 && (
                        <PremiumCard className="p-4 bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-100 dark:border-cyan-900/50">
                            <div className="flex items-center gap-3">
                                <Dumbbell className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                <div>
                                    <p className="text-xs font-bold uppercase opacity-70 text-cyan-900 dark:text-cyan-100">Benchmark</p>
                                    <p className="text-xl font-mono font-bold text-cyan-950 dark:text-cyan-50">{totalBenchmarkReps.toLocaleString()} <span className="text-sm">reps</span></p>
                                    <p className="text-[10px] text-cyan-700 dark:text-cyan-300/60 font-medium mt-0.5">
                                        {totalSquats}sq · {totalPushups}pu · {totalBurpees}bp
                                    </p>
                                </div>
                            </div>
                        </PremiumCard>
                    )}
                </div>

                {/* WEEKLY BREAKDOWN TABLE */}
                <MemberWeeklyTable stats={processedStats} />

                {/* VISUALS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <PremiumCard className="p-6">
                        <h3 className="font-bold text-foreground mb-4">Weight History</h3>
                        <MemberWeightChart data={weightData} />
                    </PremiumCard>

                    <PremiumCard className="p-6">
                        <h3 className="font-bold text-foreground mb-4">Recent Attendance</h3>
                        <div className="space-y-3">
                            {member.attendance.slice(0, 5).map(a => (
                                <div key={a.id} className="flex justify-between items-center py-2 border-b border-border last:border-0 hover:bg-muted/10 transition-colors px-2 rounded-sm">
                                    <span className="text-sm font-medium text-foreground/80">
                                        {a.session.date.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className={cn(
                                        "text-xs px-2 py-1 rounded font-bold",
                                        a.isPresent
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                    )}>
                                        {a.isPresent ? 'Present' : 'Absent'}
                                    </span>
                                </div>
                            ))}
                            {member.attendance.length === 0 && <p className="text-sm text-muted-foreground italic">No attendance records yet.</p>}
                        </div>
                    </PremiumCard>
                </div>

                {/* BENCHMARK PROGRESS CHART - Full width below other visuals */}
                {benchmarkChartData.length > 0 && (
                    <BenchmarkProgressChart logs={benchmarkChartData} />
                )}
            </div>
        </div>
    );
}
