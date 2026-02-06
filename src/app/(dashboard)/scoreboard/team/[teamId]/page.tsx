
import { getActiveBlock } from "@/actions/data";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PageHeader, Button } from "@/components/ui/Components";
import { ArrowLeft, User, Trophy, Scale, Footprints, Heart, Crown } from "lucide-react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function TeamDetailPage({ params, searchParams }: { params: { teamId: string }, searchParams: { weekId?: string } }) {
    const { teamId } = await params;
    const resolvedSearchParams = await searchParams; // Await searchParams as per Next.js 15+ patterns if applicable, or safe access

    // Fetch Team
    const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: { members: true }
    });

    if (!team) return <div>Team not found</div>;

    // Determine Week
    const block = await getActiveBlock();
    if (!block) return <div>No active block</div>;

    const selectedWeekId = resolvedSearchParams?.weekId || block.weeks[0].id;
    const selectedWeek = block.weeks.find(w => w.id === selectedWeekId) || block.weeks[0];

    // Fetch Metrics for this team for this week (for summary)
    const teamMetric = await prisma.teamWeekMetric.findUnique({
        where: { teamId_blockWeekId: { teamId, blockWeekId: selectedWeekId } }
    });

    // Fetch Member Data for this week
    const members = await prisma.member.findMany({
        where: { teamId, isActive: true },
        include: {
            kmLogs: { where: { blockWeekId: selectedWeekId } },
            lifestyleLogs: { where: { blockWeekId: selectedWeekId } },
            attendance: {
                where: {
                    isPresent: true,
                    session: {
                        date: { gte: selectedWeek.startDate, lte: selectedWeek.endDate }
                    }
                }
            },
            weighIns: {
                where: {
                    date: { in: [selectedWeek.startDate, selectedWeek.endDate] }
                }
            }
        },
        orderBy: { firstName: 'asc' }
    });

    // Process Member Stats
    const memberStats = members.map(m => {
        const totalKm = m.kmLogs.reduce((sum, log) => sum + log.totalKm, 0);
        const lifestylePoints = m.lifestyleLogs.reduce((sum, log) => sum + log.postCount, 0); // Assuming 1 pt per post for simplicity of detail view, or just counting posts
        const sessions = m.attendance.length;

        // Robust matching: compare YYYY-MM-DD
        const toDateKey = (d: Date) => d.toISOString().split('T')[0];
        const startDateKey = toDateKey(selectedWeek.startDate);
        const endDateKey = toDateKey(selectedWeek.endDate);

        const startWeight = m.weighIns.find(w => toDateKey(w.date) === startDateKey)?.weight;
        const endWeight = m.weighIns.find(w => toDateKey(w.date) === endDateKey)?.weight;

        let weightLoss = 0;
        if (startWeight !== undefined && endWeight !== undefined) {
            weightLoss = Math.max(0, startWeight - endWeight);
        }

        return {
            ...m,
            stats: {
                totalKm,
                lifestylePoints,
                sessions,
                weightLoss
            }
        };
    });

    // Check for Team Award this week
    const awards = await prisma.teamWeekAward.findMany({
        where: { teamId, blockWeekId: selectedWeekId }
    });

    return (
        <div className="min-h-full pb-10">
            <div className="mb-6 px-6 md:px-10">
                <Link href={`/scoreboard?weekId=${selectedWeekId}`}>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/10">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Scoreboard
                    </Button>
                </Link>
            </div>

            <PageHeader title={team.name} subtitle={`Week ${selectedWeek.weekNumber} Breakdown`} />

            <div className="px-6 md:px-10 mt-6 space-y-8">

                {/* HEADLINE STATS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <PremiumCard className="p-5 bg-white/5 border-white/10 hover:border-lagoon/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-lagoon/10 rounded-lg">
                                <Footprints className="w-5 h-5 text-lagoon-100" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-offwhite/60 tracking-widest">Avg KM</p>
                                <p className="text-2xl font-mono font-bold text-white">{teamMetric?.kmAverage?.toFixed(2) || "0.00"}</p>
                            </div>
                        </div>
                    </PremiumCard>
                    <PremiumCard className="p-5 bg-white/5 border-white/10 hover:border-tongan/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-tongan/10 rounded-lg">
                                <Scale className="w-5 h-5 text-tongan" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-offwhite/60 tracking-widest">Total Loss</p>
                                <p className="text-2xl font-mono font-bold text-white">{teamMetric?.weightLossTotal?.toFixed(1) || "0.0"} <span className="text-sm text-offwhite/60">kg</span></p>
                            </div>
                        </div>
                    </PremiumCard>
                    <PremiumCard className="p-5 bg-white/5 border-white/10 hover:border-green-500/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <Heart className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-offwhite/60 tracking-widest">Avg Lifestyle</p>
                                <p className="text-2xl font-mono font-bold text-white">{teamMetric?.lifestyleAverage?.toFixed(1) || "0.0"}</p>
                            </div>
                        </div>
                    </PremiumCard>
                    <PremiumCard className="p-5 bg-white/5 border-white/10 hover:border-purple-500/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <User className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-offwhite/60 tracking-widest">Avg Attendance</p>
                                <p className="text-2xl font-mono font-bold text-white">{teamMetric?.attendanceAverage?.toFixed(2) || "0.00"}</p>
                            </div>
                        </div>
                    </PremiumCard>
                </div>

                {/* AWARDS BANNER */}
                {awards.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-wrap gap-4 items-center">
                        <Trophy className="w-6 h-6 text-yellow-600" />
                        <span className="font-bold text-yellow-900">Weekly Awards:</span>
                        {awards.map(a => (
                            <span key={a.id} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold uppercase">
                                {a.category.replace('_', ' ')}
                            </span>
                        ))}
                    </div>
                )}

                {/* MEMBER DETAIL TABLE */}
                <PremiumCard className="overflow-hidden border border-white/5">
                    <div className="p-6 border-b border-white/5 bg-white/5 flex items-center space-x-3">
                        <div className="p-2 bg-ocean/10 rounded-lg">
                            <User className="w-5 h-5 text-ocean-dark" />
                        </div>
                        <h3 className="font-bold text-white text-lg tracking-wide">Member Contributions</h3>
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#0B3C5D] text-white font-semibold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Member</th>
                                    <th className="px-6 py-4 text-center">Sessions</th>
                                    <th className="px-6 py-4 text-right">KM Run</th>
                                    <th className="px-6 py-4 text-right">Lifestyle</th>
                                    <th className="px-6 py-4 text-right">Weight Loss</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {memberStats.map(m => (
                                    <tr key={m.id} className="hover:bg-[#12394D] transition-colors border-l-4 border-transparent hover:border-lagoon">
                                        <td className="px-6 py-4 font-bold text-white">
                                            {m.firstName} {m.lastName}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn(
                                                "inline-block px-2 py-1 rounded text-xs font-bold",
                                                m.stats.sessions >= 3 ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/10 text-slate-400 border border-white/10"
                                            )}>
                                                {m.stats.sessions}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-white">
                                            {m.stats.totalKm.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-white">
                                            {m.stats.lifestylePoints}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-white">
                                            {m.stats.weightLoss > 0
                                                ? <span className="text-green-400">-{m.stats.weightLoss.toFixed(1)}</span>
                                                : <span className="text-slate-500">-</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARDS */}
                    <div className="md:hidden divide-y divide-white/5">
                        {memberStats.map(m => (
                            <div key={m.id} className="p-4 hover:bg-white/5 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-bold text-white">{m.firstName} {m.lastName}</h4>
                                    <span className={cn(
                                        "inline-block px-2 py-0.5 rounded text-xs font-bold",
                                        m.stats.sessions >= 3 ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/10 text-slate-400 border border-white/10"
                                    )}>
                                        {m.stats.sessions} Sessions
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                                        <p className="text-[10px] uppercase text-offwhite/60 font-bold tracking-widest">KM</p>
                                        <p className="font-mono font-bold text-lagoon-100">{m.stats.totalKm.toFixed(1)}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                                        <p className="text-[10px] uppercase text-offwhite/60 font-bold tracking-widest">Lifestyle</p>
                                        <p className="font-mono font-bold text-green-400">{m.stats.lifestylePoints}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                                        <p className="text-[10px] uppercase text-offwhite/60 font-bold tracking-widest">Loss</p>
                                        <p className="font-mono font-bold text-tongan">
                                            {m.stats.weightLoss > 0 ? m.stats.weightLoss.toFixed(1) : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </PremiumCard>

            </div>
        </div>
    );
}
