import { PageHeader } from "@/components/ui/Components";
import { Suspense } from "react";
import { getActiveBlock } from "@/actions/data";
import DashboardAnalytics from "@/components/analytics/DashboardAnalytics";
import LoginFeedback from "@/components/auth/LoginFeedback";
import { DashboardClientView } from "@/components/dashboard/DashboardClientView";
import prisma from "@/lib/prisma";

async function getStats() {
  const activeBlock = await getActiveBlock();
  if (!activeBlock) return null;

  const teamsList = await prisma.team.findMany();
  const teamCount = teamsList.length;
  const memberCount = await prisma.member.count({ where: { isActive: true } });

  // Calculate total weight loss across all weeks in the block
  const allMetrics = await prisma.teamWeekMetric.findMany({
    where: { blockWeek: { blockId: activeBlock.id } },
    include: { team: true, blockWeek: true }
  });

  const totalLoss = allMetrics.reduce((sum, m) => sum + (m.weightLossTotal || 0), 0);

  // Determine current week
  const now = new Date();
  // Sort weeks
  const weeks = activeBlock.weeks.sort((a, b) => a.weekNumber - b.weekNumber);

  let currentWeek = weeks.find(w => now >= w.startDate && now <= w.endDate);
  if (!currentWeek) {
    if (now < weeks[0].startDate) currentWeek = weeks[0];
    else if (now > weeks[weeks.length - 1].endDate) currentWeek = weeks[weeks.length - 1];
  }
  const currentWeekNumber = currentWeek?.weekNumber || 1;

  // Leaderboard Data (Top 3)
  const pointTotals = await prisma.pointLedger.groupBy({
    by: ['teamId'],
    _sum: { amount: true }
  });

  const teamPointsMap = new Map<string, number>();
  pointTotals.forEach(pt => {
    teamPointsMap.set(pt.teamId, pt._sum.amount || 0);
  });

  const leaderboard = teamsList.map(t => ({
    name: t.name,
    points: teamPointsMap.get(t.id) || 0,
    id: t.id
  })).sort((a, b) => b.points - a.points).slice(0, 3);

  // --- Chart Data Preparation ---
  // Attendance Chart Data
  const sessions = await prisma.session.findMany({
    where: { blockId: activeBlock.id },
    orderBy: { date: 'asc' },
    include: { attendance: true }
  });

  const attendanceData = sessions.map(session => {
    const presentCount = session.attendance.filter(a => a.isPresent).length;
    // Prevent division by zero if no members
    const percentage = memberCount > 0 ? (presentCount / memberCount) * 100 : 0;

    return {
      date: session.date.toISOString(), // formatting will be handled in client if needed, or simple date string
      percentage: parseFloat(percentage.toFixed(1)),
      type: session.type,
      present: presentCount,
      total: memberCount
    };
  });


  return {
    teams: teamCount,
    members: memberCount,
    weeksCompleted: weeks.filter(w => w.endDate < now).length,
    totalLoss,
    currentWeekNumber,
    leaderboard,
    allMetrics, // Pass raw metrics to client
    teamsList, // Pass teams list
    attendanceData, // Pass attendance data
    charts: {}
  };
}



export default async function Home() {
  const stats = await getStats();

  if (!stats) {
    return (
      <div className="min-h-full pb-10 flex items-center justify-center">
        <div className="text-center p-10 bg-ocean-deep/80 backdrop-blur-md rounded-xl shadow-2xl border border-lagoon/20">
          <h2 className="text-xl font-bold text-white">No Active Block Found</h2>
          <p className="text-lagoon-100/60 mt-2">Please initialize a training block in the database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-10">
      <PageHeader title="Dashboard" subtitle="Command Center" />
      <Suspense fallback={null}>
        <LoginFeedback />
      </Suspense>

      {/* Hand off to Client Component for Animations and Interactivity */}
      <DashboardClientView stats={stats} />
    </div>
  );
}
