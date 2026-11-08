import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { addUtcDays } from '@/lib/dates';
import { checkInColumns, type CheckInMember } from '@/lib/check-in';

export async function getCheckInSnapshot(weekId: string, db: Prisma.TransactionClient = prisma) {
    const week = await db.blockWeek.findUnique({ where: { id: weekId }, include: { block: { select: { name: true, isActive: true } } } });
    if (!week) return null;
    const endDate = addUtcDays(week.startDate, 7);
    const [sessions, finalizedWeeks] = await Promise.all([
        db.session.findMany({ where: { blockId: week.blockId, date: { gte: week.startDate, lt: addUtcDays(week.endDate, 1) } }, orderBy: { date: 'asc' } }),
        db.blockWeek.findMany({ where: { isFinalized: true, startDate: { gt: addUtcDays(week.startDate, -10), lte: addUtcDays(endDate, 1) } }, select: { startDate: true } }),
    ]);
    const columns = checkInColumns(week, sessions, finalizedWeeks);
    const records = await db.member.findMany({
        where: { isActive: true }, orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: {
            team: true,
            weighIns: { where: { date: { gte: week.startDate, lte: endDate } } },
            kmLogs: { where: { blockWeekId: week.id } },
            lifestyleLogs: { where: { blockWeekId: week.id } },
            attendance: { where: { sessionId: { in: sessions.map(session => session.id) } } },
        },
    });
    const members: CheckInMember[] = records.map(member => {
        const weightAt = (date: Date) => member.weighIns.find(log => log.date.getTime() === date.getTime())?.weight;
        return {
            id: member.id, name: `${member.firstName} ${member.lastName}`, teamId: member.teamId, teamName: member.team?.name ?? 'Unassigned',
            values: {
                'weight-start': weightAt(week.startDate) === undefined ? null : String(weightAt(week.startDate)),
                'weight-end': weightAt(endDate) === undefined ? null : String(weightAt(endDate)),
                km: member.kmLogs[0] ? String(member.kmLogs[0].totalKm) : null,
                lifestyle: member.lifestyleLogs[0] ? String(member.lifestyleLogs[0].postCount) : null,
                ...Object.fromEntries(sessions.map(session => {
                    const record = member.attendance.find(attendance => attendance.sessionId === session.id);
                    return [`attendance:${session.id}`, record ? record.isPresent ? 'present' : 'absent' : null];
                })),
            },
        };
    });
    return { week, columns, members };
}
