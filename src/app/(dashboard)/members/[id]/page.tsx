
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PageHeader, Button } from "@/components/ui/Components";
import { ArrowLeft, Activity, Scale, User, CalendarDays } from "lucide-react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import MemberWeightChart from "@/components/analytics/MemberWeightChart";

export default async function MemberProfilePage({ params }: { params: { id: string } }) {
    const { id } = await params;

    const member = await prisma.member.findUnique({
        where: { id },
        include: {
            team: true,
            weighIns: { orderBy: { date: 'asc' } },
            attendance: { orderBy: { session: { date: 'desc' } }, include: { session: true } },
            kmLogs: true,
            lifestyleLogs: true
        }
    });

    if (!member) return <div>Member not found</div>;

    // Stats
    const totalKm = member.kmLogs.reduce((acc, log) => acc + log.totalKm, 0);
    const totalSessions = member.attendance.filter(a => a.isPresent).length;
    const startWeight = member.weighIns[0]?.weight;
    const currentWeight = member.weighIns[member.weighIns.length - 1]?.weight;
    const totalLoss = startWeight && currentWeight ? (startWeight - currentWeight) : 0;

    // Chart Data
    const weightData = member.weighIns.map(w => ({
        date: w.date.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' }),
        weight: w.weight
    }));

    return (
        <div className="min-h-full pb-10">
            <div className="mb-6">
                <Link href="/members">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Members
                    </Button>
                </Link>
            </div>

            <PageHeader title={`${member.firstName} ${member.lastName}`} subtitle={member.team?.name || "Unassigned"} />

            <div className="px-6 md:px-10 mt-6 space-y-8">
                {/* HEADLINE STATS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PremiumCard className="p-4 bg-blue-50 border-blue-100 text-blue-900">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-xs font-bold uppercase opacity-70">Total KM</p>
                                <p className="text-xl font-mono font-bold">{totalKm.toFixed(1)} <span className="text-sm">km</span></p>
                            </div>
                        </div>
                    </PremiumCard>
                    <PremiumCard className="p-4 bg-purple-50 border-purple-100 text-purple-900">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="w-5 h-5 text-purple-600" />
                            <div>
                                <p className="text-xs font-bold uppercase opacity-70">Sessions</p>
                                <p className="text-xl font-mono font-bold">{totalSessions}</p>
                            </div>
                        </div>
                    </PremiumCard>
                    <PremiumCard className="p-4 bg-red-50 border-red-100 text-red-900">
                        <div className="flex items-center gap-3">
                            <Scale className="w-5 h-5 text-red-600" />
                            <div>
                                <p className="text-xs font-bold uppercase opacity-70">Weight Loss</p>
                                <p className="text-xl font-mono font-bold">{totalLoss > 0 ? totalLoss.toFixed(1) : "0.0"} <span className="text-sm">kg</span></p>
                            </div>
                        </div>
                    </PremiumCard>
                </div>

                {/* CHART */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <PremiumCard className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Weight History</h3>
                        <MemberWeightChart data={weightData} />
                    </PremiumCard>

                    <PremiumCard className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Recent Attendance</h3>
                        <div className="space-y-3">
                            {member.attendance.slice(0, 5).map(a => (
                                <div key={a.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                    <span className="text-sm font-medium text-gray-700">
                                        {a.session.date.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded font-bold ${a.isPresent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {a.isPresent ? 'Present' : 'Absent'}
                                    </span>
                                </div>
                            ))}
                            {member.attendance.length === 0 && <p className="text-sm text-gray-500 italic">No attendance records yet.</p>}
                        </div>
                    </PremiumCard>
                </div>
            </div>
        </div>
    );
}
