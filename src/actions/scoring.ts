'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
    calculateTeamMetrics,
    determineWinners,
    ScorableTeam,
    TeamResult
} from '@/lib/scoring-logic';

export async function calculateWeekResults(blockWeekId: string) {
    const blockWeek = await prisma.blockWeek.findUnique({
        where: { id: blockWeekId }
    });
    if (!blockWeek) throw new Error("Week not found");

    // 1. Fetch Teams and Members
    // We fetch everything needed for calculation in one go
    const teams = await prisma.team.findMany({
        include: {
            members: {
                where: { isActive: true },
                include: {
                    kmLogs: { where: { blockWeekId } },
                    lifestyleLogs: { where: { blockWeekId } },
                    weighIns: {
                        where: {
                            date: {
                                // Fetch all weigh-ins up to the end of this week
                                // This allows us to find a "previous" weigh-in for baseline calculation
                                lte: blockWeek.endDate
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

    // 2. Calculate Logic (Pure - No DB Side Effects)
    const config = {
        startDate: blockWeek.startDate,
        endDate: blockWeek.endDate
    };

    // Cast or Map - Prisma types are compatible structurally for the fields we need
    // but explicit mapping is safer for maintenance
    const scorableTeams: ScorableTeam[] = teams.map(t => ({
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

    const results = calculateTeamMetrics(scorableTeams, config);
    const awards = determineWinners(results);

    // 3. Execute Updates in Transaction
    await prisma.$transaction(async (tx) => {
        // A. Save/Reset Metrics
        for (const res of results) {
            await tx.teamWeekMetric.upsert({
                where: { teamId_blockWeekId: { teamId: res.teamId, blockWeekId } },
                update: {
                    kmAverage: res.kmAvg,
                    lifestyleAverage: res.lifestyleAvg,
                    attendanceAverage: res.attendanceAvg,
                    weightLossTotal: res.weightLossTotal,
                    pointsAwarded: 0 // Reset points
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

        // B. Clear Old Awards & Ledger
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
        for (const award of awards) {
            // Create Award Record
            await tx.teamWeekAward.create({
                data: {
                    teamId: award.teamId,
                    blockWeekId,
                    category: award.category
                }
            });

            // Update Metric pointsAwarded
            await tx.teamWeekMetric.update({
                where: { teamId_blockWeekId: { teamId: award.teamId, blockWeekId } },
                data: { pointsAwarded: { increment: 1 } }
            });

            // Ledger Entry
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
