import { PageHeader } from "@/components/ui/Components";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Suspense } from "react";
import { getActiveBlock } from "@/actions/data";
import LoginFeedback from "@/components/auth/LoginFeedback";
import { DashboardClientView } from "@/components/dashboard/DashboardClientView";
import prisma from "@/lib/prisma";

import { unstable_cache } from "next/cache";

const getStats = unstable_cache(async () => {
  const activeBlock = await getActiveBlock();
  if (!activeBlock) return null;

  const teamsList = await prisma.team.findMany();
  const teamCount = teamsList.length;
  const memberCount = await prisma.member.count({ where: { isActive: true } });

  // 1. Fetch RAW metrics for the table (lightweight, no nested relations needed for logs)
  const allMetrics = await prisma.teamWeekMetric.findMany({
    where: { blockWeek: { blockId: activeBlock.id } },
    include: { team: true, blockWeek: true }
  });

  // 2. Optimized Total Weight Loss (Database Aggregation)
  const weightLossAgg = await prisma.teamWeekMetric.aggregate({
    where: { blockWeek: { blockId: activeBlock.id } },
    _sum: { weightLossTotal: true }
  });
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

  // 3. Leaderboard Data (Top 3) - Optimized GroupBy
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

  // 4. Optimized Weekly Totals (KM & Lifestyle) - Database GroupBy
  // Instead of fetching ALL logs, we group by blockWeekId and sum directly in DB
  const [kmGroups, lifestyleGroups] = await Promise.all([
    prisma.kmLog.groupBy({
      by: ['blockWeekId'],
      where: { blockWeek: { blockId: activeBlock.id } },
      _sum: { totalKm: true }
    }),
    prisma.lifestyleLog.groupBy({
      by: ['blockWeekId'],
      where: { blockWeek: { blockId: activeBlock.id } },
      _sum: { postCount: true }
    })
  ]);

  const weeklyTotals = weeks.map(week => {
    const kmEntry = kmGroups.find(g => g.blockWeekId === week.id);
    const lifeEntry = lifestyleGroups.find(g => g.blockWeekId === week.id);

    return {
      weekNumber: week.weekNumber,
      totalKm: kmEntry?._sum.totalKm || 0,
      totalLifestyle: lifeEntry?._sum.postCount || 0
    };
  });

  // 5. Optimized Attendance Data
  // Fetch sessions with a COUNT of present attendance, not the full records
  const sessions = await prisma.session.findMany({
    where: { blockId: activeBlock.id },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      date: true,
      type: true,
      attendance: {
        where: { isPresent: true },
        select: { id: true } // Select minimal field to count in JS if _count not available in finding relations
      }
    }
  });

  const attendanceData = sessions.map(session => {
    const presentCount = session.attendance.length; // Count of 'isPresent: true' records
    const percentage = memberCount > 0 ? (presentCount / memberCount) * 100 : 0;

    return {
      date: session.date.toISOString(),
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
    allMetrics,
    teamsList,
    attendanceData,
    weeklyTotals,
    charts: {}
  };
}, ['dashboard-stats'], { revalidate: 60, tags: ['dashboard-stats'] });

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
      <Suspense fallback={<DashboardSkeleton />}>
        <LoginFeedback />
      </Suspense>

      {/* Hand off to Client Component for Animations and Interactivity */}
      <DashboardClientView stats={stats} />
    </div>
  );
}
