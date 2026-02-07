'use server';

import prisma from '@/lib/prisma';
import { format } from 'date-fns';

export async function exportBlockData(blockId: string, type: 'attendance' | 'km' | 'lifestyle' | 'weigh-in') {
    const block = await prisma.block.findUnique({
        where: { id: blockId },
        include: {
            weeks: { orderBy: { weekNumber: 'asc' } },
            sessions: { orderBy: { date: 'asc' } }
        }
    });

    if (!block) {
        throw new Error('Block not found');
    }

    const members = await prisma.member.findMany({
        where: { isActive: true },
        include: {
            team: true,
            attendance: {
                where: { session: { blockId } },
                include: { session: true }
            },
            kmLogs: {
                where: { blockWeek: { blockId } },
                include: { blockWeek: true }
            },
            lifestyleLogs: {
                where: { blockWeek: { blockId } },
                include: { blockWeek: true }
            },
            weighIns: {
                where: {
                    date: {
                        gte: block.startDate,
                        lte: block.endDate
                    }
                },
                orderBy: { date: 'asc' }
            }
        },
        orderBy: { lastName: 'asc' }
    });

    let csvContent = '';

    if (type === 'attendance') {
        // Header: First Name, Last Name, Team, Total Present, Rate, [Session 1], [Session 2]...
        const headers = ['First Name', 'Last Name', 'Team', 'Total Present', 'Rate (%)'];
        const sessions = block.sessions;
        sessions.forEach(s => headers.push(`${format(s.date, 'MMM d')} (${s.type})`));

        csvContent += headers.join(',') + '\n';

        members.forEach(member => {
            const totalPresent = member.attendance.filter(a => a.isPresent).length;
            const rate = sessions.length > 0 ? (totalPresent / sessions.length) * 100 : 0;

            const row = [
                member.firstName,
                member.lastName,
                member.team?.name || 'Unassigned',
                totalPresent.toString(),
                rate.toFixed(1)
            ];

            sessions.forEach(session => {
                const record = member.attendance.find(a => a.sessionId === session.id);
                row.push(record ? (record.isPresent ? 'Present' : 'Absent') : '-');
            });

            csvContent += row.join(',') + '\n';
        });

    } else if (type === 'km') {
        // Header: First Name, Last Name, Team, Total KM, [Week 1], [Week 2]...
        const headers = ['First Name', 'Last Name', 'Team', 'Total KM'];
        const weeks = block.weeks;
        weeks.forEach(w => headers.push(`Week ${w.weekNumber}`));

        csvContent += headers.join(',') + '\n';

        members.forEach(member => {
            const totalKm = member.kmLogs.reduce((sum, log) => sum + log.totalKm, 0);

            const row = [
                member.firstName,
                member.lastName,
                member.team?.name || 'Unassigned',
                totalKm.toFixed(2)
            ];

            weeks.forEach(week => {
                const log = member.kmLogs.find(l => l.blockWeekId === week.id);
                row.push(log ? log.totalKm.toString() : '0');
            });

            csvContent += row.join(',') + '\n';
        });

    } else if (type === 'lifestyle') {
        // Header: First Name, Last Name, Team, Total Posts, [Week 1], [Week 2]...
        const headers = ['First Name', 'Last Name', 'Team', 'Total Posts'];
        const weeks = block.weeks;
        weeks.forEach(w => headers.push(`Week ${w.weekNumber}`));

        csvContent += headers.join(',') + '\n';

        members.forEach(member => {
            const totalPosts = member.lifestyleLogs.reduce((sum, log) => sum + log.postCount, 0);

            const row = [
                member.firstName,
                member.lastName,
                member.team?.name || 'Unassigned',
                totalPosts.toString()
            ];

            weeks.forEach(week => {
                const log = member.lifestyleLogs.find(l => l.blockWeekId === week.id);
                row.push(log ? log.postCount.toString() : '0');
            });

            csvContent += row.join(',') + '\n';
        });

    } else if (type === 'weigh-in') {
        // Header: First Name, Last Name, Team, Start Weight, Current Weight, Change, [Week 1], [Week 2]...
        // For weigh-ins, we align with weeks. We try to find a weigh-in that falls within each week.
        const headers = ['First Name', 'Last Name', 'Team', 'Start Weight', 'Current Weight', 'Change'];
        const weeks = block.weeks;
        weeks.forEach(w => headers.push(`Week ${w.weekNumber} (${format(w.startDate, 'MMM d')})`));

        csvContent += headers.join(',') + '\n';

        members.forEach(member => {
            // Sort weigh-ins by date
            const sortedWeighIns = member.weighIns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            const startWeight = sortedWeighIns.length > 0 ? sortedWeighIns[0].weight : 0;
            const currentWeight = sortedWeighIns.length > 0 ? sortedWeighIns[sortedWeighIns.length - 1].weight : 0;
            const change = startWeight > 0 ? (currentWeight - startWeight) : 0;

            const row = [
                member.firstName,
                member.lastName,
                member.team?.name || 'Unassigned',
                startWeight > 0 ? startWeight.toFixed(1) : '-',
                currentWeight > 0 ? currentWeight.toFixed(1) : '-',
                startWeight > 0 ? change.toFixed(1) : '-'
            ];

            weeks.forEach(week => {
                // Find a weigh-in that occurred during this week (start date to end date)
                // Assuming end date is start date + 6 days
                const weekEnd = new Date(week.startDate);
                weekEnd.setDate(weekEnd.getDate() + 6);

                // Find the latest weigh-in for this week
                const log = member.weighIns.find(w => {
                    const wDate = new Date(w.date);
                    return wDate >= week.startDate && wDate <= weekEnd;
                });

                row.push(log ? log.weight.toString() : '-');
            });

            csvContent += row.join(',') + '\n';
        });
    }

    return csvContent;
}
