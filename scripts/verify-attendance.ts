
import { PrismaClient } from '@prisma/client';
import { calculateWeekResults } from '../src/actions/scoring';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting verification...");

    // cleanup
    console.log("Cleaning up old test data...");
    await prisma.pointLedger.deleteMany({ where: { reason: { contains: "VERIFY_TEST" } } });
    const testBlock = await prisma.block.findFirst({ where: { name: "VERIFY_TEST_BLOCK" } });
    if (testBlock) {
        const weeks = await prisma.blockWeek.findMany({ where: { blockId: testBlock.id } });
        const weekIds = weeks.map(w => w.id);

        // Delete things linked to BlockWeek
        await prisma.teamWeekAward.deleteMany({ where: { blockWeekId: { in: weekIds } } });
        await prisma.teamWeekMetric.deleteMany({ where: { blockWeekId: { in: weekIds } } });
        await prisma.kmLog.deleteMany({ where: { blockWeekId: { in: weekIds } } });
        await prisma.lifestyleLog.deleteMany({ where: { blockWeekId: { in: weekIds } } });

        await prisma.blockWeek.deleteMany({ where: { blockId: testBlock.id } });

        // Delete sessions and attendance
        const sessions = await prisma.session.findMany({ where: { blockId: testBlock.id } });
        const sessionIds = sessions.map(s => s.id);
        await prisma.attendance.deleteMany({ where: { sessionId: { in: sessionIds } } });
        await prisma.session.deleteMany({ where: { blockId: testBlock.id } });

        await prisma.block.delete({ where: { id: testBlock.id } });
    }

    const testTeams = await prisma.team.findMany({ where: { name: { in: ["VERIFY_TEAM_A", "VERIFY_TEAM_B"] } } });
    const teamIds = testTeams.map(t => t.id);
    if (teamIds.length > 0) {
        // Dependencies of Team
        await prisma.pointLedger.deleteMany({ where: { teamId: { in: teamIds } } });
        await prisma.teamWeekAward.deleteMany({ where: { teamId: { in: teamIds } } });
        await prisma.teamWeekMetric.deleteMany({ where: { teamId: { in: teamIds } } });

        // Members and their dependencies
        const members = await prisma.member.findMany({ where: { teamId: { in: teamIds } } });
        const memberIds = members.map(m => m.id);

        await prisma.attendance.deleteMany({ where: { memberId: { in: memberIds } } });
        await prisma.kmLog.deleteMany({ where: { memberId: { in: memberIds } } });
        await prisma.lifestyleLog.deleteMany({ where: { memberId: { in: memberIds } } });
        await prisma.weighIn.deleteMany({ where: { memberId: { in: memberIds } } });

        await prisma.member.deleteMany({ where: { teamId: { in: teamIds } } });

        await prisma.team.deleteMany({ where: { id: { in: teamIds } } });
    }


    // 1. Setup Data
    console.log("Setting up test data...");
    const block = await prisma.block.create({
        data: {
            name: "VERIFY_TEST_BLOCK",
            startDate: new Date("2025-01-01"),
            endDate: new Date("2025-02-01"),
            isActive: true
        }
    });

    const blockWeek = await prisma.blockWeek.create({
        data: {
            blockId: block.id,
            weekNumber: 1,
            startDate: new Date("2025-01-01"),
            endDate: new Date("2025-01-07")
        }
    });

    const teamA = await prisma.team.create({ data: { name: "VERIFY_TEAM_A" } });
    const teamB = await prisma.team.create({ data: { name: "VERIFY_TEAM_B" } });

    // Members (4 each to be eligible)
    const createMembers = async (teamId: string, count: number) => {
        const members = [];
        for (let i = 0; i < count; i++) {
            members.push(await prisma.member.create({
                data: {
                    firstName: `TestMem${i}`,
                    lastName: `Team${teamId.substring(0, 4)}`,
                    teamId: teamId,
                    isActive: true
                }
            }));
        }
        return members;
    };

    const membersA = await createMembers(teamA.id, 4);
    const membersB = await createMembers(teamB.id, 4);

    // Sessions
    const session1 = await prisma.session.create({
        data: {
            blockId: block.id,
            date: new Date("2025-01-02"), // Inside week
            type: "Monday"
        }
    });
    const session2 = await prisma.session.create({
        data: {
            blockId: block.id,
            date: new Date("2025-01-04"), // Inside week
            type: "Wednesday"
        }
    });

    // Attendance
    // Team A: Low attendance
    // Member 0 attends session 1. Total 1. Avg 0.25
    await prisma.attendance.create({
        data: { sessionId: session1.id, memberId: membersA[0].id, isPresent: true }
    });

    // Team B: High attendance
    // All members attend both sessions. Total 8. Avg 2.0
    for (const m of membersB) {
        await prisma.attendance.create({ data: { sessionId: session1.id, memberId: m.id, isPresent: true } });
        await prisma.attendance.create({ data: { sessionId: session2.id, memberId: m.id, isPresent: true } });
    }

    // 2. Run Calculation
    console.log("Running calculation...");
    try {
        await calculateWeekResults(blockWeek.id);
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (e.message.includes("static generation store missing") || e.message.includes("revalidatePath")) {
            console.log("Ignoring revalidatePath error (expected in standalone script)");
        } else {
            console.error("Calculation failed:", e);
            process.exit(1);
        }
    }

    // 3. Verify Results
    console.log("Verifying results...");

    // Check Metrics
    const metricA = await prisma.teamWeekMetric.findUnique({
        where: { teamId_blockWeekId: { teamId: teamA.id, blockWeekId: blockWeek.id } }
    });
    const metricB = await prisma.teamWeekMetric.findUnique({
        where: { teamId_blockWeekId: { teamId: teamB.id, blockWeekId: blockWeek.id } }
    });

    console.log("Team A Avg:", metricA?.attendanceAverage);
    console.log("Team B Avg:", metricB?.attendanceAverage);

    if (metricA?.attendanceAverage !== 0.25) console.error("FAIL: Team A Avg incorrect");
    if (metricB?.attendanceAverage !== 2.0) console.error("FAIL: Team B Avg incorrect");

    // Check Award
    const awardB = await prisma.teamWeekAward.findFirst({
        where: {
            teamId: teamB.id,
            blockWeekId: blockWeek.id,
            category: "ATTENDANCE_AVG"
        }
    });
    const awardA = await prisma.teamWeekAward.findFirst({
        where: {
            teamId: teamA.id,
            blockWeekId: blockWeek.id,
            category: "ATTENDANCE_AVG"
        }
    });

    if (awardB) console.log("PASS: Team B has Attendance Award");
    else console.error("FAIL: Team B missing Attendance Award");

    if (!awardA) console.log("PASS: Team A does not have Attendance Award");
    else console.error("FAIL: Team A should not have Attendance Award");

    // Check Ledger
    const ledgerB = await prisma.pointLedger.findFirst({
        where: {
            teamId: teamB.id,
            reason: { contains: "Winner: ATTENDANCE_AVG" }
        }
    });

    if (ledgerB && ledgerB.amount === 1) console.log("PASS: Team B got +1 point in ledger");
    else console.error("FAIL: Team B missing correct ledger entry");

    // Cleanup
    console.log("Cleaning up...");
    // await prisma.block.delete({ where: { id: block.id } }); // cascading might be tricky, keep it for manual inspection if needed or use separate cleanup
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
