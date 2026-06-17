'use server';

import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { addDays } from 'date-fns';
import {
    calculateTeamMetrics,
    determineWinners,
    ScorableTeam
} from '@/lib/scoring-logic';
import { requireAdmin } from '@/lib/auth-guard';
import { writeAuditLog } from '@/lib/audit';

export async function calculateWeekResults(
    blockWeekId: string,
    options?: { lockWeek?: boolean }
) {
    const guard = await requireAdmin();
    if (!guard.success) throw new Error(guard.message);

    const blockWeek = await prisma.blockWeek.findUnique({
        where: { id: blockWeekId },
        include: { block: { include: { weeks: { orderBy: { weekNumber: 'asc' } } } } }
    });
    if (!blockWeek) throw new Error("Week not found");
    if (blockWeek.isFinalized) {
        throw new Error("Week is already finalized. Unfinalize it before recalculating.");
    }

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
                                    lte: blockWeek.endDate
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
    const finalResults = calculateTeamMetrics(currentScorableTeams, currentConfig);

    // Determine winners
    const finalAwards = determineWinners(finalResults);

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
                blockId: blockWeek.blockId,
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

        // D. Lock the week in the same transaction so a failure can never
        // leave computed awards on an unlocked (still editable) week.
        if (options?.lockWeek) {
            await tx.blockWeek.update({
                where: { id: blockWeekId },
                data: { isFinalized: true }
            });
        }
    });

    await writeAuditLog({
        action: options?.lockWeek ? "FINALIZE_SCORES" : "CALCULATE_WEEK_RESULTS",
        details: `${options?.lockWeek ? 'Finalized' : 'Recalculated'} week ${blockWeek.weekNumber} scores for block ${blockWeek.blockId} (${finalAwards.length} award${finalAwards.length === 1 ? '' : 's'}).`,
        entityType: "BlockWeek",
        entityId: blockWeekId
    });

    revalidatePath('/scoreboard');
    revalidateTag('dashboard-stats', 'max');
}
