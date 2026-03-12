import { PageHeader } from "@/components/ui/Components";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Suspense } from "react";
import { getActiveBlock } from "@/actions/data";
import LoginFeedback from "@/components/auth/LoginFeedback";
import { DashboardClientView } from "@/components/dashboard/DashboardClientView";
import prisma from "@/lib/prisma";

import { unstable_cache } from "next/cache";

export const getStats = unstable_cache(async () => {
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
  // Fetch sessions with a COUNT of present attendance
  const sessions = await prisma.session.findMany({
    where: { blockId: activeBlock.id },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      date: true,
      type: true,
      _count: {
        select: {
          attendance: {
            where: { isPresent: true }
          }
        }
      }
    }
  });

  const attendanceData = sessions.map(session => {
    const presentCount = session._count.attendance; // Count of 'isPresent: true' records
    const percentage = memberCount > 0 ? (presentCount / memberCount) * 100 : 0;

    return {
      date: session.date.toISOString(),
      percentage: parseFloat(percentage.toFixed(1)),
      type: session.type,
      present: presentCount,
      total: memberCount
    };
  });

  // 6. Data Completeness for current week
  const currentWeekId = currentWeek?.id;
  let dataCompleteness = {
    weighIns: { entered: 0, total: memberCount },
    km: { entered: 0, total: memberCount },
    lifestyle: { entered: 0, total: memberCount },
    attendance: { sessionsWithData: 0, totalSessions: 0 },
  };

  if (currentWeekId && currentWeek) {
    const [weighInUsers, kmUsers, lifestyleUsers] = await Promise.all([
      prisma.weighIn.findMany({
        where: {
          member: { isActive: true },
          date: {
            gte: currentWeek.startDate,
            lte: currentWeek.endDate,
          },
          weight: { gt: 0 }
        },
        distinct: ['memberId'],
        select: { memberId: true }
      }),
      prisma.kmLog.findMany({
        where: {
          member: { isActive: true },
          blockWeekId: currentWeekId,
          totalKm: { gt: 0 }
        },
        distinct: ['memberId'],
        select: { memberId: true }
      }),
      prisma.lifestyleLog.findMany({
        where: {
          member: { isActive: true },
          blockWeekId: currentWeekId,
          postCount: { gt: 0 }
        },
        distinct: ['memberId'],
        select: { memberId: true }
      }),
    ]);

    const weighInCount = weighInUsers.length;
    const kmCount = kmUsers.length;
    const lifestyleCount = lifestyleUsers.length;

    // Count sessions in this week that have at least one attendance record
    const weekSessions = sessions.filter(s => {
      const sDate = new Date(s.date);
      return sDate >= currentWeek.startDate && sDate <= currentWeek.endDate;
    });
    const sessionsWithData = weekSessions.filter(s => s._count.attendance > 0).length;

    dataCompleteness = {
      weighIns: { entered: weighInCount, total: memberCount },
      km: { entered: kmCount, total: memberCount },
      lifestyle: { entered: lifestyleCount, total: memberCount },
      attendance: { sessionsWithData, totalSessions: weekSessions.length },
    };
  }

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
}, ['dashboard-stats'], { revalidate: 60, tags: ['dashboard-stats'] });

async function DashboardContent() {
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
