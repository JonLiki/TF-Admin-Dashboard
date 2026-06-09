/**
 * Read-only database query functions.
 *
 * These are NOT Server Actions — they are plain async functions meant to be
 * called directly from Server Components.  Keeping reads separate from
 * mutations (Server Actions in `src/actions/`) means Next.js can deduplicate,
 * cache, and statically-analyse these calls more effectively.
 */

import prisma from '@/lib/prisma';
import { utcDayRange } from '@/lib/dates';

// ─── Block Queries ──────────────────────────────────────────────────────────

export async function getActiveBlock() {
    return await prisma.block.findFirst({
        where: { isActive: true },
        include: {
            weeks: { orderBy: { weekNumber: 'asc' } },
            sessions: { orderBy: { date: 'asc' } }
        }
    });
}

export async function getBlocks() {
    return await prisma.block.findMany({
        include: {
            _count: {
                select: { weeks: true, sessions: true }
            },
            weeks: {
                orderBy: { weekNumber: 'asc' },
                select: { id: true, weekNumber: true, startDate: true, endDate: true, isFinalized: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

// ─── Week Data Completeness ─────────────────────────────────────────────────

export async function getWeekDataCompleteness(blockWeekId: string) {
    const week = await prisma.blockWeek.findUnique({
        where: { id: blockWeekId },
        include: { block: true }
    });
    if (!week) return null;

    const memberCount = await prisma.member.count({ where: { isActive: true } });

    const [weighInCount, kmCount, lifestyleCount] = await Promise.all([
        prisma.weighIn.count({
            where: {
                member: { isActive: true },
                date: { gte: week.startDate, lte: week.endDate }
            }
        }),
        prisma.kmLog.count({
            where: {
                member: { isActive: true },
                blockWeekId,
            }
        }),
        prisma.lifestyleLog.count({
            where: {
                member: { isActive: true },
                blockWeekId,
            }
        }),
    ]);

    // Count sessions in this week that have attendance records.
    // NOTE: This intentionally counts ALL attendance records (present + absent),
    // because the purpose is to check "has the admin entered attendance data" for completeness.
    // This differs from the scoring engine which only counts isPresent: true — that's by design.
    const sessions = await prisma.session.findMany({
        where: {
            blockId: week.blockId,
            date: { gte: week.startDate, lte: week.endDate }
        },
        include: {
            _count: { select: { attendance: true } }
        }
    });

    const sessionsWithData = sessions.filter(s => s._count.attendance > 0).length;

    return {
        weighIns: { entered: weighInCount, total: memberCount },
        km: { entered: kmCount, total: memberCount },
        lifestyle: { entered: lifestyleCount, total: memberCount },
        attendance: { sessionsWithData, totalSessions: sessions.length },
        isFinalized: week.isFinalized,
        weekNumber: week.weekNumber,
    };
}

// ─── Session Queries ────────────────────────────────────────────────────────

export async function getSessionById(sessionId: string) {
    return await prisma.session.findUnique({
        where: { id: sessionId },
        include: { attendance: true }
    });
}

export async function getSessionsForWeek(weekId: string) {
    const week = await prisma.blockWeek.findUnique({
        where: { id: weekId }
    });

    if (!week) return [];

    return await prisma.session.findMany({
        where: {
            blockId: week.blockId,
            date: {
                gte: week.startDate,
                lte: week.endDate
            }
        },
        include: { attendance: true },
        orderBy: { date: 'asc' }
    });
}

// ─── Weigh-In Queries ───────────────────────────────────────────────────────

export async function getWeighIns(date: Date) {
    const { start, end } = utcDayRange(date);

    return await prisma.weighIn.findMany({
        where: {
            date: {
                gte: start,
                lt: end
            }
        },
        include: { member: true }
    });
}

// ─── Member Queries ─────────────────────────────────────────────────────────

export async function getTeams() {
    return await prisma.team.findMany({
        include: {
            members: {
                select: { id: true, firstName: true, lastName: true, isActive: true },
                orderBy: { lastName: 'asc' }
            },
            _count: {
                select: { members: true }
            }
        },
        orderBy: { name: 'asc' }
    });
}

export async function getMembers() {
    return await prisma.member.findMany({
        include: { team: true },
        orderBy: { lastName: 'asc' }
    });
}

export async function getMembersWithLogs(blockWeekId: string) {
    return await prisma.member.findMany({
        where: { isActive: true },
        include: {
            team: true,
            kmLogs: { where: { blockWeekId } },
            lifestyleLogs: { where: { blockWeekId } },
            benchmarkLogs: { where: { blockWeekId } }
        },
        orderBy: { lastName: 'asc' }
    });
}

export async function getMembersWithWeighIn(date: Date) {
    const { start, end } = utcDayRange(date);

    return await prisma.member.findMany({
        where: { isActive: true },
        include: {
            team: true,
            weighIns: {
                where: {
                    date: {
                        gte: start,
                        lt: end
                    }
                }
            }
        },
        orderBy: { lastName: 'asc' }
    });
}

// ─── Summary Report ─────────────────────────────────────────────────────────

export async function getFullBlockSummary() {
    const block = await prisma.block.findFirst({
        where: { isActive: true },
        include: {
            weeks: { orderBy: { weekNumber: 'asc' } },
        }
    });

    if (!block) return null;

    // Blocks end on a Sunday but the final weigh-in is logged on the following
    // Monday, so the window extends one day past endDate.
    const finalWeighInDate = new Date(block.endDate.getTime() + 24 * 60 * 60 * 1000);

    const members = await prisma.member.findMany({
        where: { isActive: true },
        include: {
            team: true,
            weighIns: {
                where: {
                    date: {
                        gte: block.startDate,
                        lte: finalWeighInDate
                    }
                },
                orderBy: { date: 'asc' }
            },
            kmLogs: true,
            lifestyleLogs: true,
            benchmarkLogs: true,
            attendance: {
                where: {
                    session: {
                        blockId: block.id
                    }
                }
            }
        },
        orderBy: { lastName: 'asc' }
    });

    // Also fetch all sessions for the block to calculate attendance totals/percentages if needed
    const sessions = await prisma.session.findMany({
        where: { blockId: block.id },
        orderBy: { date: 'asc' }
    });

    return { block, members, sessions };
}

// ─── Dashboard Stats Helpers ────────────────────────────────────────────────

export async function getLeaderboard(blockId: string, teamsList: { id: string; name: string }[]) {
    const pointTotals = await prisma.pointLedger.groupBy({
        by: ['teamId'],
        where: { blockId },
        _sum: { amount: true }
    });

    const teamPointsMap = new Map<string, number>();
    pointTotals.forEach(pt => {
        teamPointsMap.set(pt.teamId, pt._sum?.amount || 0);
    });

    return teamsList.map(t => ({
        name: t.name,
        points: teamPointsMap.get(t.id) || 0,
        id: t.id
    })).sort((a, b) => b.points - a.points).slice(0, 3);
}

export async function getWeeklyTotals(blockId: string, weeks: { id: string; weekNumber: number }[]) {
    const [kmGroups, lifestyleGroups] = await Promise.all([
        prisma.kmLog.groupBy({
            by: ['blockWeekId'],
            where: { blockWeek: { blockId } },
            _sum: { totalKm: true }
        }),
        prisma.lifestyleLog.groupBy({
            by: ['blockWeekId'],
            where: { blockWeek: { blockId } },
            _sum: { postCount: true }
        })
    ]);

    return weeks.map(week => {
        const kmEntry = kmGroups.find(g => g.blockWeekId === week.id);
        const lifeEntry = lifestyleGroups.find(g => g.blockWeekId === week.id);

        return {
            weekNumber: week.weekNumber,
            totalKm: kmEntry?._sum.totalKm || 0,
            totalLifestyle: lifeEntry?._sum.postCount || 0
        };
    });
}

export async function getAttendanceData(blockId: string, memberCount: number) {
    const sessions = await prisma.session.findMany({
        where: { blockId },
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

    return sessions.map(session => {
        const presentCount = session._count.attendance;
        const percentage = memberCount > 0 ? (presentCount / memberCount) * 100 : 0;

        return {
            date: session.date.toISOString(),
            percentage: parseFloat(percentage.toFixed(1)),
            type: session.type,
            present: presentCount,
            total: memberCount
        };
    });
}

export async function getCurrentWeekCompleteness(
    currentWeek: { id: string; startDate: Date; endDate: Date; blockId: string } | undefined,
    memberCount: number
) {
    const dataCompleteness = {
        weighIns: { entered: 0, total: memberCount },
        km: { entered: 0, total: memberCount },
        lifestyle: { entered: 0, total: memberCount },
        attendance: { sessionsWithData: 0, totalSessions: 0 },
    };

    if (!currentWeek) return dataCompleteness;

    const [weighInUsers, kmUsers, lifestyleUsers, weekSessions] = await Promise.all([
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
                blockWeekId: currentWeek.id,
                totalKm: { gt: 0 }
            },
            distinct: ['memberId'],
            select: { memberId: true }
        }),
        prisma.lifestyleLog.findMany({
            where: {
                member: { isActive: true },
                blockWeekId: currentWeek.id,
                postCount: { gt: 0 }
            },
            distinct: ['memberId'],
            select: { memberId: true }
        }),
        prisma.session.findMany({
            where: {
                blockId: currentWeek.blockId,
                date: { gte: currentWeek.startDate, lte: currentWeek.endDate }
            },
            select: {
                _count: {
                    select: {
                        attendance: {
                            where: { isPresent: true }
                        }
                    }
                }
            }
        })
    ]);

    const weighInCount = weighInUsers.length;
    const kmCount = kmUsers.length;
    const lifestyleCount = lifestyleUsers.length;
    const sessionsWithData = weekSessions.filter(s => s._count.attendance > 0).length;

    return {
        weighIns: { entered: weighInCount, total: memberCount },
        km: { entered: kmCount, total: memberCount },
        lifestyle: { entered: lifestyleCount, total: memberCount },
        attendance: { sessionsWithData, totalSessions: weekSessions.length },
    };
}

