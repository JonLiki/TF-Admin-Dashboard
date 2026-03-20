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
                        lte: new Date(new Date(block.endDate).setHours(23, 59, 59, 999))
                    }
                },
                orderBy: { date: 'asc' }
            }
        },
        orderBy: { lastName: 'asc' }
    });

    let csvContent = '';

    // Group members by team
    const teamsMap = new Map<string, typeof members>();
    members.forEach(member => {
        const teamName = member.team?.name || 'Unassigned';
        if (!teamsMap.has(teamName)) {
            teamsMap.set(teamName, []);
        }
        teamsMap.get(teamName)?.push(member);
    });

    // Sort teams alphabetically
    const sortedTeams = Array.from(teamsMap.entries()).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));

    if (type === 'attendance') {
        // Header: First Name, Last Name, Team, Total Present, Rate, [Session 1], [Session 2]...
        const headers = ['First Name', 'Last Name', 'Team', 'Total Present', 'Rate (%)'];
        const sessions = block.sessions;
        sessions.forEach(s => headers.push(`${format(s.date, 'MMM d')} (${s.type})`));

        csvContent += headers.join(',') + '\n';

        sortedTeams.forEach(([teamName, teamMembers]) => {
            let teamTotalPresent = 0;
            const teamTotalPossible = teamMembers.length * sessions.length;
            const teamSessionTotals = new Array(sessions.length).fill(0);

            teamMembers.forEach(member => {
                const totalPresent = member.attendance.filter(a => a.isPresent).length;
                teamTotalPresent += totalPresent;
                const rate = sessions.length > 0 ? (totalPresent / sessions.length) * 100 : 0;

                const row = [
                    member.firstName,
                    member.lastName,
                    teamName,
                    totalPresent.toString(),
                    rate.toFixed(1)
                ];

                sessions.forEach((session, idx) => {
                    const record = member.attendance.find(a => a.sessionId === session.id);
                    if (record?.isPresent) teamSessionTotals[idx]++;
                    row.push(record ? (record.isPresent ? 'Present' : 'Absent') : '-');
                });

                csvContent += row.join(',') + '\n';
            });

            // Team Total Row
            const teamRate = teamTotalPossible > 0 ? (teamTotalPresent / teamTotalPossible) * 100 : 0;
            const totalRow = [
                'TEAM TOTAL',
                '',
                teamName,
                teamTotalPresent.toString(),
                teamRate.toFixed(1)
            ];

            teamSessionTotals.forEach(total => {
                totalRow.push(total.toString());
            });

            csvContent += totalRow.join(',') + '\n\n'; // Add extra newline for spacing
        });

    } else if (type === 'km') {
        // Header: First Name, Last Name, Team, Total KM, [Week 1], [Week 2]...
        const headers = ['First Name', 'Last Name', 'Team', 'Total KM'];
        const weeks = block.weeks;
        weeks.forEach(w => headers.push(`Week ${w.weekNumber}`));

        csvContent += headers.join(',') + '\n';

        sortedTeams.forEach(([teamName, teamMembers]) => {
            let teamTotalKm = 0;
            const teamWeekTotals = new Array(weeks.length).fill(0);

            teamMembers.forEach(member => {
                const totalKm = member.kmLogs.reduce((sum, log) => sum + log.totalKm, 0);
                teamTotalKm += totalKm;

                const row = [
                    member.firstName,
                    member.lastName,
                    teamName,
                    totalKm.toFixed(2)
                ];

                weeks.forEach((week, idx) => {
                    const log = member.kmLogs.find(l => l.blockWeekId === week.id);
                    const weekKm = log ? log.totalKm : 0;
                    teamWeekTotals[idx] += weekKm;
                    row.push(weekKm.toString());
                });

                csvContent += row.join(',') + '\n';
            });

            // Team Total Row
            const totalRow = [
                'TEAM TOTAL',
                '',
                teamName,
                teamTotalKm.toFixed(2)
            ];

            teamWeekTotals.forEach(total => {
                totalRow.push(total.toFixed(2));
            });

            csvContent += totalRow.join(',') + '\n\n'; // Add extra newline for spacing
        });

    } else if (type === 'lifestyle') {
        // Header: First Name, Last Name, Team, Total Posts, [Week 1], [Week 2]...
        const headers = ['First Name', 'Last Name', 'Team', 'Total Posts'];
        const weeks = block.weeks;
        weeks.forEach(w => headers.push(`Week ${w.weekNumber}`));

        csvContent += headers.join(',') + '\n';

        sortedTeams.forEach(([teamName, teamMembers]) => {
            let teamTotalPosts = 0;
            const teamWeekTotals = new Array(weeks.length).fill(0);

            teamMembers.forEach(member => {
                const totalPosts = member.lifestyleLogs.reduce((sum, log) => sum + log.postCount, 0);
                teamTotalPosts += totalPosts;

                const row = [
                    member.firstName,
                    member.lastName,
                    teamName,
                    totalPosts.toString()
                ];

                weeks.forEach((week, idx) => {
                    const log = member.lifestyleLogs.find(l => l.blockWeekId === week.id);
                    const weekPosts = log ? log.postCount : 0;
                    teamWeekTotals[idx] += weekPosts;
                    row.push(weekPosts.toString());
                });

                csvContent += row.join(',') + '\n';
            });

            // Team Total Row
            const totalRow = [
                'TEAM TOTAL',
                '',
                teamName,
                teamTotalPosts.toString()
            ];

            teamWeekTotals.forEach(total => {
                totalRow.push(total.toString());
            });

            csvContent += totalRow.join(',') + '\n\n'; // Add extra newline for spacing
        });

    } else if (type === 'weigh-in') {
        // Header: First Name, Last Name, Team, Start Weight, Current Weight, Change, [Week 1], [Week 2]...
        // For weigh-ins, we align with weeks. We try to find a weigh-in that falls within each week.
        const headers = ['First Name', 'Last Name', 'Team', 'Start Weight', 'Current Weight', 'Overall Change'];
        const weeks = block.weeks;
        weeks.forEach(w => headers.push(`Week ${w.weekNumber} (${format(w.startDate, 'MMM d')})`));
        headers.push(`Final (${format(block.endDate, 'MMM d')})`);

        csvContent += headers.join(',') + '\n';

        sortedTeams.forEach(([teamName, teamMembers]) => {
            let teamTotalStartWeight = 0;
            let teamTotalCurrentWeight = 0;
            let teamTotalWeightLoss = 0; // Only positive weight loss

            const teamWeekTotals = new Array(weeks.length).fill(0);

            teamMembers.forEach(member => {
                // Sort weigh-ins by date
                const sortedWeighIns = member.weighIns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                const startWeight = sortedWeighIns.length > 0 ? sortedWeighIns[0].weight : 0;
                const currentWeight = sortedWeighIns.length > 0 ? sortedWeighIns[sortedWeighIns.length - 1].weight : 0;
                const change = startWeight > 0 ? (currentWeight - startWeight) : 0;

                if (startWeight > 0) teamTotalStartWeight += startWeight;
                if (currentWeight > 0) teamTotalCurrentWeight += currentWeight;

                // For overall grand total we only sum up folks who lost weight:
                if (startWeight > 0 && currentWeight > 0 && change < 0) {
                    teamTotalWeightLoss += Math.abs(change);
                }

                const row = [
                    member.firstName,
                    member.lastName,
                    teamName,
                    startWeight > 0 ? startWeight.toFixed(1) : '-',
                    currentWeight > 0 ? currentWeight.toFixed(1) : '-',
                    startWeight > 0 ? change.toFixed(1) : '-'
                ];

                weeks.forEach((week, idx) => {
                    const weekEnd = new Date(week.startDate);
                    weekEnd.setDate(weekEnd.getDate() + 7); // extend to next Monday

                    const log = member.weighIns.find(w => {
                        const wDate = new Date(w.date);
                        return wDate >= week.startDate && wDate <= weekEnd;
                    });

                    row.push(log ? log.weight.toString() : '-');

                    // Weekly team weight loss calculation:
                    // Week N loss = Weight[Week N] - Weight[Week N+1]
                    const nextWeek = weeks[idx + 1];
                    let nextLog = undefined;

                    if (nextWeek) {
                        const nextWeekEnd = new Date(nextWeek.startDate);
                        nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
                        nextLog = member.weighIns.find(w => {
                            const wDate = new Date(w.date);
                            return wDate >= nextWeek.startDate && wDate <= nextWeekEnd;
                        });
                    } else {
                        // For the last week (idx === weeks.length - 1), 
                        // the "nextLog" is the final weigh-in on block.endDate
                        const blockEndStart = new Date(block.endDate);
                        blockEndStart.setHours(0, 0, 0, 0);
                        const blockEndEnd = new Date(block.endDate);
                        blockEndEnd.setHours(23, 59, 59, 999);
                        nextLog = member.weighIns.find(w => {
                            const wDate = new Date(w.date);
                            return wDate >= blockEndStart && wDate <= blockEndEnd;
                        });
                    }

                    if (log && log.weight > 0 && nextLog && nextLog.weight > 0) {
                        const delta = log.weight - nextLog.weight;
                        if (delta > 0) {
                            teamWeekTotals[idx] += delta;
                        }
                    }
                });

                // Final weigh-in column
                const finalLog = member.weighIns.find(w => {
                    const wDate = new Date(w.date);
                    const blockEndStart = new Date(block.endDate);
                    blockEndStart.setHours(0, 0, 0, 0);
                    const blockEndEnd = new Date(block.endDate);
                    blockEndEnd.setHours(23, 59, 59, 999);
                    return wDate >= blockEndStart && wDate <= blockEndEnd;
                });
                row.push(finalLog ? finalLog.weight.toString() : '-');

                csvContent += row.join(',') + '\n';
            });

            // Team Total Row
            const totalRow = [
                'TEAM TOTAL',
                '',
                teamName,
                teamTotalStartWeight > 0 ? teamTotalStartWeight.toFixed(1) : '-',
                teamTotalCurrentWeight > 0 ? teamTotalCurrentWeight.toFixed(1) : '-',
                teamTotalWeightLoss > 0 ? `-${teamTotalWeightLoss.toFixed(1)}` : '0.0'
            ];

            teamWeekTotals.forEach((total, idx) => {
                if (idx === 0) {
                    totalRow.push(total > 0 ? total.toFixed(1) : '-');
                } else {
                    totalRow.push(total < 0 ? total.toFixed(1) : (total === 0 ? '0.0' : `+${total.toFixed(1)}`));
                }
            });

            // Final total (not technically a delta total, but for consistency we can leave blank or sum)
            totalRow.push('');

            csvContent += totalRow.join(',') + '\n\n'; // Add extra newline for spacing
        });
    }

    return csvContent;
}
