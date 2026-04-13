'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { addDays } from 'date-fns';
import {
    calculateTeamMetrics,
    determineWinners,
    ScorableTeam
} from '@/lib/scoring-logic';

export async function calculateWeekResults(blockWeekId: string) {
    const blockWeek = await prisma.blockWeek.findUnique({
        where: { id: blockWeekId },
        include: { block: { include: { weeks: { orderBy: { weekNumber: 'asc' } } } } }
    });
    if (!blockWeek) throw new Error("Week not found");

    const weekNumber = blockWeek.weekNumber;
    const totalWeeks = blockWeek.block.weeks.length;
    const isLastWeek = weekNumber === totalWeeks;

    // 1. Fetch Data for Current Week (KM, Lifestyle, Attendance, WeighIns)
    // Weight loss is calculated directly by calculateTeamMetrics as:
    //   (weight logged during this week) - (weight logged during next week)
    // So we need weigh-in data that extends into the next week's date range.
    const currentTeams = await prisma.team.findMany({
        include: {
            members: {
                where: { isActive: true },
                include: {
                    kmLogs: { where: { blockWeekId } },
                    lifestyleLogs: { where: { blockWeekId } },
                    weighIns: {
                        where: {
                            date: {
                                lte: addDays(blockWeek.endDate, 14) // Lookahead to cover next week's weigh-in
                            }
                        },
                        orderBy: { date: 'asc' }
                    },
                    attendance: {
                        where: {
                            isPresent: true,
                            session: {
                                date: {
                                    gte: blockWeek.startDate,
                                    lt: blockWeek.endDate
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const currentConfig = {
        startDate: blockWeek.startDate,
        endDate: blockWeek.endDate
    };

    const currentScorableTeams: ScorableTeam[] = currentTeams.map(t => ({
        id: t.id,
        name: t.name,
        members: t.members.map(m => ({
            id: m.id,
            kmLogs: m.kmLogs,
            lifestyleLogs: m.lifestyleLogs,
            attendance: m.attendance,
            weighIns: m.weighIns
        }))
    }));

    // Calculate current week metrics (WL is already computed correctly as this_week - next_week)
    const currentResults = calculateTeamMetrics(currentScorableTeams, currentConfig);
    
    // For the last week, WL is 0 since there's no next week weigh-in data
    const finalResults = isLastWeek
        ? currentResults.map(r => ({ ...r, weightLossTotal: 0 }))
        : currentResults;

    // Determine winners
    const allAwards = determineWinners(finalResults);
    
    // Suppress ALL awards for the last week
    const finalAwards = isLastWeek ? [] : allAwards;

    // 3. Execute Updates in Transaction
    await prisma.$transaction(async (tx) => {
        // A. Save metrics (these are now potentially shifted for WL)
        for (const res of finalResults) {
            await tx.teamWeekMetric.upsert({
                where: { teamId_blockWeekId: { teamId: res.teamId, blockWeekId } },
                update: {
                    kmAverage: res.kmAvg,
                    lifestyleAverage: res.lifestyleAvg,
                    attendanceAverage: res.attendanceAvg,
                    weightLossTotal: res.weightLossTotal,
                    pointsAwarded: 0 
                },
                create: {
                    teamId: res.teamId,
                    blockWeekId,
                    kmAverage: res.kmAvg,
                    lifestyleAverage: res.lifestyleAvg,
                    attendanceAverage: res.attendanceAvg,
                    weightLossTotal: res.weightLossTotal,
                    pointsAwarded: 0
                }
            });
        }

        // B. Clear Old Awards & Ledger for this week
        await tx.teamWeekAward.deleteMany({
            where: { blockWeekId }
        });

        await tx.pointLedger.deleteMany({
            where: {
                reason: {
                    contains: `(Week ${blockWeek.weekNumber})`,
                    startsWith: "Winner:"
                }
            }
        });

        // C. Apply New Awards
        for (const award of finalAwards) {
            await tx.teamWeekAward.create({
                data: {
                    teamId: award.teamId,
                    blockWeekId,
                    category: award.category
                }
            });

            await tx.teamWeekMetric.update({
                where: { teamId_blockWeekId: { teamId: award.teamId, blockWeekId } },
                data: { pointsAwarded: { increment: 1 } }
            });

            await tx.pointLedger.create({
                data: {
                    teamId: award.teamId,
                    blockId: blockWeek.blockId,
                    amount: 1,
                    reason: `Winner: ${award.category} (Week ${blockWeek.weekNumber})`
                }
            });
        }
    });

    revalidatePath('/scoreboard');
}
