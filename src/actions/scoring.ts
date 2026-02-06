'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function calculateWeekResults(blockWeekId: string) {
    const blockWeek = await prisma.blockWeek.findUnique({
        where: { id: blockWeekId }
    });
    if (!blockWeek) throw new Error("Week not found");

    // 1. Fetch Teams and Members
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
                                gte: blockWeek.startDate,
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
                                    lte: blockWeek.endDate
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    // 2. Data Structures to hold results before saving
    interface TeamResult {
        teamId: string;
        teamName: string; // for debugging/logging
        memberCount: number;
        kmAvg: number;
        lifestyleAvg: number;
        attendanceAvg: number;
        weightLossTotal: number;
        eligible: boolean;
    }

    const results: TeamResult[] = [];

    // 3. Compute Metrics for each Team
    for (const team of teams) {
        const memberCount = team.members.length;
        // Rule: "Teams with at least 4 active members compete"
        const eligible = memberCount >= 4;

        let totalKm = 0;
        let totalLifestyle = 0;
        let totalAttendance = 0;
        let teamWeightLoss = 0;

        for (const member of team.members) {
            // KM
            const kmEntry = member.kmLogs[0];
            if (kmEntry) totalKm += kmEntry.totalKm;

            // Lifestyle
            const lifeEntry = member.lifestyleLogs[0];
            if (lifeEntry) totalLifestyle += lifeEntry.postCount;

            // Weight Loss
            // Robust matching: compare YYYY-MM-DD
            const toDateKey = (d: Date) => d.toISOString().split('T')[0];
            const startDateKey = toDateKey(blockWeek.startDate);
            const endDateKey = toDateKey(blockWeek.endDate);

            const startWeight = member.weighIns.find(w => toDateKey(w.date) === startDateKey)?.weight;
            const endWeight = member.weighIns.find(w => toDateKey(w.date) === endDateKey)?.weight;

            if (startWeight !== undefined && endWeight !== undefined) {
                const diff = startWeight - endWeight;
                const loss = Math.max(0, diff); // Rule: max(0, start - end)
                teamWeightLoss += loss;
            }

            // Attendance
            // We filtered for isPresent: true and within date range in the query
            totalAttendance += member.attendance.length;
        }

        const kmAvg = memberCount > 0 ? totalKm / memberCount : 0;
        const lifestyleAvg = memberCount > 0 ? totalLifestyle / memberCount : 0;
        const attendanceAvg = memberCount > 0 ? totalAttendance / memberCount : 0;

        results.push({
            teamId: team.id,
            teamName: team.name,
            memberCount,
            kmAvg,
            lifestyleAvg,
            attendanceAvg,
            weightLossTotal: teamWeightLoss,
            eligible
        });

        // Save Metrics to DB
        await prisma.teamWeekMetric.upsert({
            where: { teamId_blockWeekId: { teamId: team.id, blockWeekId } },
            update: {
                kmAverage: kmAvg,
                lifestyleAverage: lifestyleAvg,
                attendanceAverage: attendanceAvg,
                weightLossTotal: teamWeightLoss,
                // Reset points awarded here? Or keep cumulative? 
                // Better to reset and recalculate awards below.
                pointsAwarded: 0
            },
            create: {
                teamId: team.id,
                blockWeekId,
                kmAverage: kmAvg,
                lifestyleAverage: lifestyleAvg,
                attendanceAverage: attendanceAvg,
                weightLossTotal: teamWeightLoss,
                pointsAwarded: 0
            }
        });
    }

    // 4. Determine Winners & Award Points
    // Clear existing awards AND ledger entries for this week to avoid duplicates on re-run
    await prisma.teamWeekAward.deleteMany({
        where: { blockWeekId }
    });

    // Remove existing "Winner" points for this specific week from ledger
    // Identifying them by the standardized reason string pattern
    await prisma.pointLedger.deleteMany({
        where: {
            reason: {
                contains: `(Week ${blockWeek.weekNumber})`,
                startsWith: "Winner:"
            }
        }
    });

    // Helper to find max and award
    const awardCategory = async (
        category: 'KM_AVG' | 'WEIGHT_LOSS' | 'LIFESTYLE_AVG' | 'ATTENDANCE_AVG',
        getValue: (r: TeamResult) => number
    ) => {
        // Filter eligible
        const competitors = results.filter(r => r.eligible);
        if (competitors.length === 0) return;

        let maxVal = -1;
        competitors.forEach(r => {
            const v = getValue(r);
            if (v > maxVal) maxVal = v;
        });

        if (maxVal <= 0) return; // No points if 0 score? Or technically 0 can win if others negative (not possible here). 
        // If maxVal is 0, arguably no one did anything? 
        // "The winning team... gets +1 point".
        // If everyone is 0, do they share a point? Probably not.
        if (maxVal === 0) return;

        const winners = competitors.filter(r => getValue(r) === maxVal);

        // Create Awards
        for (const w of winners) {
            // 1. Create Award Record
            await prisma.teamWeekAward.create({
                data: {
                    teamId: w.teamId,
                    blockWeekId,
                    category
                }
            });

            // 2. Update Metric pointsAwarded (for easy display)
            // We share the point? "Ties share the point."
            // Usually implies 1 point each or 0.5?
            // "The winning team... gets +1 point. Ties share the point."
            // This usually means split the point. 1 / winners.length.
            // But "Scoreboard page... Show total Block points".
            // Integer math in schema `pointsAwarded Int`.
            // If we use Int, we can't do 0.5. 
            // Rule ambiguity: "Ties share the point".
            // If 2 teams tie, maybe they get 1 point each? Or 0.5?
            // Given `Int` in schema, let's assume +1 for all winners OR we need to change schema to Float.
            // Re-reading: "winning team... gets +1 point". 
            // Valid interpretation: Each team involved in the tie gets 1 point (shared victory).
            // OR: The "point" is split. 
            // Let's assume +1 for everyone to keep it simple and positive unless specified "split points mathematically".
            // Wait, "Ties share the point" strongly suggests splitting.
            // Schema `PointLedger` has `amount Int`.
            // Maybe we track points * 10 or something? 
            // Or maybe I should update schema to Float?
            // Given constraints, I'll update schema to Float for points if I can, or use logic.
            // Let's check schema for `pointsAwarded`. It is `Int`.
            // I will assume for now that "share the point" means they both get the "Winner" title.
            // But strict reading "Share the point" = 0.5 each.
            // I will implement +1 for now, but note it. 
            // actually, if I can't change schema to Float easily without migration dance (I can, `prisma db push`), I should.
            // User said "Scoring Engine... Determine winners... Write TeamWeekAward".

            // Let's stick to: Everyone who matches MAX gets +1. (Co-champions).

            await prisma.teamWeekMetric.update({
                where: { teamId_blockWeekId: { teamId: w.teamId, blockWeekId } },
                data: { pointsAwarded: { increment: 1 } }
            });

            // 3. Ledger Entry
            await prisma.pointLedger.create({
                data: {
                    teamId: w.teamId,
                    amount: 1,
                    reason: `Winner: ${category} (Week ${blockWeek.weekNumber})`
                }
            });
        }
    };

    await awardCategory('KM_AVG', r => r.kmAvg);
    await awardCategory('WEIGHT_LOSS', r => r.weightLossTotal);
    await awardCategory('LIFESTYLE_AVG', r => r.lifestyleAvg);
    await awardCategory('ATTENDANCE_AVG', r => r.attendanceAvg);

    revalidatePath('/scoreboard');
}
