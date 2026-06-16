import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Suspense } from "react";
import {
  getActiveBlock,
  getLeaderboard,
  getWeeklyTotals,
  getAttendanceData,
  getCurrentWeekCompleteness
} from "@/lib/queries";
import LoginFeedback from "@/components/auth/LoginFeedback";
import { DashboardClientView } from "@/components/dashboard/DashboardClientView";
import prisma from "@/lib/prisma";

export async function getStats() {
  const activeBlock = await getActiveBlock();
  if (!activeBlock) return null;

  const [teamsList, memberCount] = await Promise.all([
    prisma.team.findMany(),
    prisma.member.count({ where: { isActive: true } })
  ]);
  const teamCount = teamsList.length;

  // Fetch metrics and weight loss in parallel
  const [allMetrics, weightLossAgg] = await Promise.all([
    prisma.teamWeekMetric.findMany({
      where: { blockWeek: { blockId: activeBlock.id } },
      include: { team: true, blockWeek: true }
    }),
    prisma.teamWeekMetric.aggregate({
      where: { blockWeek: { blockId: activeBlock.id } },
      _sum: { weightLossTotal: true }
    })
  ]);
  const totalLoss = weightLossAgg._sum.weightLossTotal || 0;

  // Determine current week
  const now = new Date();
  const weeks = activeBlock.weeks.sort((a, b) => a.weekNumber - b.weekNumber);
  let currentWeek = weeks.find(w => now >= w.startDate && now <= w.endDate);
  if (!currentWeek) {
    if (now < weeks[0].startDate) currentWeek = weeks[0];
    else if (now > weeks[weeks.length - 1].endDate) currentWeek = weeks[weeks.length - 1];
  }
  const currentWeekNumber = currentWeek?.weekNumber || 1;

  // Execute remaining composable queries in parallel
  const [leaderboard, weeklyTotals, attendanceData, dataCompleteness] = await Promise.all([
    getLeaderboard(activeBlock.id, teamsList),
    getWeeklyTotals(activeBlock.id, weeks),
    getAttendanceData(activeBlock.id, memberCount),
    getCurrentWeekCompleteness(currentWeek, memberCount)
  ]);

  return {
    teams: teamCount,
    members: memberCount,
    weeksCompleted: weeks.filter(w => w.endDate < now).length,
    totalLoss,
    currentWeekNumber,
    leaderboard,
    allMetrics,
    teamsList,
    attendanceData,
    weeklyTotals,
    dataCompleteness,
    charts: {}
  };
}

async function DashboardContent() {
  const stats = await getStats();

  if (!stats) {
    return (
      <div className="min-h-full pb-10 flex items-center justify-center">
        <div className="text-center p-10 bg-ocean-deep/80 backdrop-blur-md rounded-xl shadow-2xl border border-lagoon/20">
          <h2 className="text-xl font-bold text-foreground">No Active Block Found</h2>
          <p className="text-lagoon-100/60 mt-2">Please initialize a training block in the database.</p>
        </div>
      </div>
    );
  }

  return <DashboardClientView stats={stats} />;
}

export default function Home() {
  return (
    <div className="min-h-full pb-10">
      <PageHeader title="Dashboard" subtitle="Command Center" />
      
      {/* Login Feedback handles its own Suspense internally or is client-driven, 
          but adding Suspense wrapper is good practice */}
      <Suspense fallback={null}>
        <LoginFeedback />
      </Suspense>

      {/* Wrapping the heavy DB queries in Suspense allows PageHeader and layout to paint instantly */}
      <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
      </Suspense>
    </div>
  );
}
