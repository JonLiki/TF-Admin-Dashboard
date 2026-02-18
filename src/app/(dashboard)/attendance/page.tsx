import { getActiveBlock, getSession } from "@/actions/data";
import { getMembers } from "@/actions";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Button, PageHeader } from "@/components/ui/Components";
import { CalendarCheck, TrendingUp, CheckCircle, XCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { SessionSelector } from "@/components/attendance/SessionSelector";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { AttendanceList } from "@/components/attendance/AttendanceList";
import { ExportButton } from "@/components/shared/ExportButton";

export default async function AttendancePage({ searchParams }: { searchParams: { sessionId?: string } }) {
    const block = await getActiveBlock();
    if (!block) return <div className="min-h-screen flex items-center justify-center text-slate-400">No active block found.</div>;
    if (!block.sessions || block.sessions.length === 0) return <div className="min-h-screen flex items-center justify-center text-slate-400">No sessions found for this block.</div>;

    const selectedSessionId = (await searchParams)?.sessionId || block.sessions[0]?.id;
    const selectedSession = block.sessions.find(s => s.id === selectedSessionId) || block.sessions[0];
    const session = await getSession(selectedSessionId);
    const members = await getMembers();

    if (!session) return <div className="min-h-screen flex items-center justify-center text-slate-400">Session not found</div>;

    // Calculate summary statistics
    const attendanceMap = new Set(session.attendance.filter(a => a.isPresent).map(a => a.memberId));
    const totalPresent = attendanceMap.size;
    const totalAbsent = members.length - totalPresent;
    const attendanceRate = members.length > 0 ? (totalPresent / members.length) * 100 : 0;

    return (
        <div className="min-h-full pb-10">
            <PageHeader title="Attendance" subtitle="Session Attendance">
                <SessionSelector
                    sessions={block.sessions.map((s) => ({
                        value: s.id,
                        label: `${format(s.date, 'eee, MMM d')} (${s.type})`
                    }))}
                    selectedSessionId={selectedSessionId}
                />
                <ExportButton blockId={block.id} type="attendance" />
            </PageHeader>

            {/* Summary Cards */}
            <div className="px-6 md:px-10 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard
                        icon={TrendingUp}
                        iconColor="text-lagoon-100"
                        iconBg="bg-lagoon/10"
                        label="Attendance Rate"
                        value={`${attendanceRate.toFixed(0)}%`}
                        subtitle="Overall attendance"
                    />
                    <SummaryCard
                        icon={CheckCircle}
                        iconColor="text-green-400"
                        iconBg="bg-green-500/10"
                        label="Present"
                        value={totalPresent}
                        subtitle="Members attended"
                    />
                    <SummaryCard
                        icon={XCircle}
                        iconColor="text-red-400"
                        iconBg="bg-red-500/10"
                        label="Absent"
                        value={totalAbsent}
                        subtitle="Did not attend"
                    />
                    <SummaryCard
                        icon={Calendar}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                        label="Session Type"
                        value={selectedSession.type}
                        subtitle={format(selectedSession.date, 'MMM d, yyyy')}
                    />
                </div>
            </div>

            <div className="px-6 md:px-10 mt-6">
                <div className="px-6 md:px-10 mt-6">
                    <AttendanceList
                        members={members}
                        session={session}
                        attendanceMap={attendanceMap}
                    />
                </div>
            </div>
        </div>
    );
}
