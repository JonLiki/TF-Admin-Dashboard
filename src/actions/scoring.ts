'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { addDays } from 'date-fns';
import {
    calculateTeamMetrics,
    determineWinners,
    ScorableTeam,
    AwardResult
} from '@/lib/scoring-logic';

export async function calculateWeekResults(blockWeekId: string) {
    const blockWeek = await prisma.blockWeek.findUnique({
        where: { id: blockWeekId },
        include: { block: { include: { weeks: { orderBy: { weekNumber: 'asc' } } } } }
    });
    if (!blockWeek) throw new Error("Week not found");

    const weekNumber = blockWeek.weekNumber;
    const isLastWeek = weekNumber === 9; // Assuming Week 9 is always last based on request

    // 1. Fetch Data for Current Week (KM, Lifestyle, Attendance)
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
                                lte: addDays(blockWeek.endDate, 7) // Standard lookahead for WL if needed
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

    // Calculate current week metrics
    const currentResults = calculateTeamMetrics(currentScorableTeams, currentConfig);
    
    // 2. Handle Shifted Weight Loss Data
    let finalResults = currentResults.map(r => ({ ...r }));
    
    if (!isLastWeek) {
        const nextWeek = blockWeek.block.weeks.find(w => w.weekNumber === weekNumber + 1);
        if (nextWeek) {
            const nextWeekId = nextWeek.id;
            const nextTeams = await prisma.team.findMany({
                include: {
                    members: {
                        where: { isActive: true },
                        include: {
                            kmLogs: { where: { blockWeekId: nextWeekId } },
                            lifestyleLogs: { where: { blockWeekId: nextWeekId } },
                            weighIns: {
                                where: {
                                    date: {
                                        lte: addDays(nextWeek.endDate, 7)
                                    }
                                },
                                orderBy: { date: 'asc' }
                            },
                            attendance: {
                                where: {
                                    isPresent: true,
                                    session: {
                                        date: {
                                            gte: nextWeek.startDate,
                                            lt: nextWeek.endDate
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const nextConfig = {
                startDate: nextWeek.startDate,
                endDate: nextWeek.endDate
            };

            const nextScorableTeams: ScorableTeam[] = nextTeams.map(t => ({
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

            const nextResults = calculateTeamMetrics(nextScorableTeams, nextConfig);
            
            // SHIFT: Replace current WL with next week's WL
            finalResults = finalResults.map(curr => {
                const next = nextResults.find(n => n.teamId === curr.teamId);
                return {
                    ...curr,
                    weightLossTotal: next ? next.weightLossTotal : 0
                };
            });
        }
    } else {
        // Last Week (Week 9): WL is set to 0 as it shifted to Week 8
        finalResults = finalResults.map(r => ({ ...r, weightLossTotal: 0 }));
    }

    // Determine winners based on the SHIFTED results
    // For KM, Life, Att, these are still current week data
    // For WL, this is now the shifted data
    const allAwards = determineWinners(finalResults);
    
    // Suppress ALL awards for Week 9
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
                    amount: 1,
                    reason: `Winner: ${award.category} (Week ${blockWeek.weekNumber})`
                }
            });
        }
    });

    revalidatePath('/scoreboard');
}
