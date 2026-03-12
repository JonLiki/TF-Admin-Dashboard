import { getActiveBlock, getSessionsForWeek } from "@/actions/data";
import { getMembers } from "@/actions";
import { PageHeader } from "@/components/ui/Components";
import { CalendarCheck, TrendingUp, CheckCircle, XCircle, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { WeekSelector } from "@/components/attendance/WeekSelector";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { WeeklyAttendanceTable } from "@/components/attendance/WeeklyAttendanceTable";
import { ExportButton } from "@/components/shared/ExportButton";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function AttendancePage({ searchParams }: { searchParams: { weekId?: string } }) {
    const block = await getActiveBlock();
    if (!block) return <div className="min-h-screen flex items-center justify-center p-6"><EmptyState icon={AlertCircle} title="No Active Block" description="There is no active competition block. Please create one from the admin settings." /></div>;

    if (!block.weeks || block.weeks.length === 0) return <div className="min-h-screen flex items-center justify-center p-6"><EmptyState icon={CalendarCheck} title="No Weeks Found" description="No weeks have been created for this block yet." /></div>;

    const selectedWeekId = (await searchParams)?.weekId || block.weeks[0]?.id;
    const selectedWeek = block.weeks.find(w => w.id === selectedWeekId) || block.weeks[0];

    const sessions = await getSessionsForWeek(selectedWeek.id);
    const members = await getMembers();

    // Calculate summary statistics across all sessions in the week
    let totalPresent = 0;

    sessions.forEach(session => {
        totalPresent += session.attendance.filter(a => a.isPresent).length;
    });

    const totalPossibleAttendances = members.length * sessions.length;
    const totalAbsent = totalPossibleAttendances - totalPresent;
    const attendanceRate = totalPossibleAttendances > 0 ? (totalPresent / totalPossibleAttendances) * 100 : 0;

    return (
        <div className="min-h-full pb-10">
            <PageHeader title="Attendance" subtitle="Weekly Attendance tracking">
                <WeekSelector
                    weeks={block.weeks.map((w) => ({
                        value: w.id,
                        label: `Week ${w.weekNumber} (${format(w.startDate, 'MMM d')} - ${format(w.endDate, 'MMM d')})`
                    }))}
                    selectedWeekId={selectedWeek.id}
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
                        label="Weekly Rate"
                        value={`${attendanceRate.toFixed(0)}%`}
                        subtitle="Overall attendance"
                    />
                    <SummaryCard
                        icon={CheckCircle}
                        iconColor="text-green-400"
                        iconBg="bg-green-500/10"
                        label="Present Logged"
                        value={totalPresent}
                        subtitle="Total check-ins"
                    />
                    <SummaryCard
                        icon={XCircle}
                        iconColor="text-red-400"
                        iconBg="bg-red-500/10"
                        label="Missed Sessions"
                        value={totalAbsent}
                        subtitle="Did not attend"
                    />
                    <SummaryCard
                        icon={Users}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                        label="Sessions this Week"
                        value={sessions.length}
                        subtitle={`Week ${selectedWeek.weekNumber} total`}
                    />
                </div>
            </div>

            <div className="px-6 md:px-10 mt-6">
                {sessions.length > 0 ? (
                    <WeeklyAttendanceTable
                        members={members}
                        sessions={sessions}
                        weekLabel={`Week ${selectedWeek.weekNumber}`}
                    />
                ) : (
                    <EmptyState
                        icon={CalendarCheck}
                        title="No Sessions"
                        description="There are no sessions scheduled for this week."
                    />
                )}
            </div>
        </div>
    );
}
