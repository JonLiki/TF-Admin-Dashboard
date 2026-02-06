
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting cleanup...");

    // 1. Find Teams to delete (User mentioned TestMem* members and team)
    // My verification script used "VERIFY_TEAM_A" and "VERIFY_TEAM_B"
    // User might see "TestMem" members. 
    // I will look for teams with "VERIFY_TEAM" in name, or members with "TestMem" in name.

    const testTeams = await prisma.team.findMany({
        where: {
            OR: [
                { name: { contains: "VERIFY_TEAM" } },
                { members: { some: { firstName: { contains: "TestMem" } } } }
            ]
        }
    });

    const teamIds = testTeams.map(t => t.id);
    console.log(`Found ${teamIds.length} teams to delete.`);

    if (teamIds.length > 0) {
        // Dependencies of Team
        console.log("Deleting Team dependencies (Ledger, Awards, Metrics)...");
        await prisma.pointLedger.deleteMany({ where: { teamId: { in: teamIds } } });
        await prisma.teamWeekAward.deleteMany({ where: { teamId: { in: teamIds } } });
        await prisma.teamWeekMetric.deleteMany({ where: { teamId: { in: teamIds } } });

        // Members and their dependencies
        console.log("Finding members...");
        const members = await prisma.member.findMany({ where: { teamId: { in: teamIds } } });
        const memberIds = members.map(m => m.id);
        console.log(`Found ${memberIds.length} members to delete.`);

        if (memberIds.length > 0) {
            console.log("Deleting Member dependencies (Attendance, Logs, WeighIns)...");
            await prisma.attendance.deleteMany({ where: { memberId: { in: memberIds } } });
            await prisma.kmLog.deleteMany({ where: { memberId: { in: memberIds } } });
            await prisma.lifestyleLog.deleteMany({ where: { memberId: { in: memberIds } } });
            await prisma.weighIn.deleteMany({ where: { memberId: { in: memberIds } } });

            console.log("Deleting Members...");
            await prisma.member.deleteMany({ where: { id: { in: memberIds } } }); // Delete by ID to be safe
        }

        console.log("Deleting Teams...");
        await prisma.team.deleteMany({ where: { id: { in: teamIds } } });
    }

    // Also clean up the Block "VERIFY_TEST_BLOCK" if it exists
    const testBlock = await prisma.block.findFirst({ where: { name: "VERIFY_TEST_BLOCK" } });
    if (testBlock) {
        console.log("Found test block, cleaning up...");
        const weeks = await prisma.blockWeek.findMany({ where: { blockId: testBlock.id } });
        const weekIds = weeks.map(w => w.id);

        // Delete things linked to BlockWeek (that might have been missed if team was deleted but metric remained? unlikely due to teamId, but awards/metrics link to blockWeek too)
        // Actually metrics/awards are linked to Team AND BlockWeek. If Team is gone, they should be gone from above.
        // But let's be safe for BlockWeek dependencies.

        await prisma.teamWeekAward.deleteMany({ where: { blockWeekId: { in: weekIds } } });
        await prisma.teamWeekMetric.deleteMany({ where: { blockWeekId: { in: weekIds } } });
        await prisma.kmLog.deleteMany({ where: { blockWeekId: { in: weekIds } } });
        await prisma.lifestyleLog.deleteMany({ where: { blockWeekId: { in: weekIds } } });

        await prisma.blockWeek.deleteMany({ where: { blockId: testBlock.id } });

        const sessions = await prisma.session.findMany({ where: { blockId: testBlock.id } });
        const sessionIds = sessions.map(s => s.id);
        await prisma.attendance.deleteMany({ where: { sessionId: { in: sessionIds } } });
        await prisma.session.deleteMany({ where: { blockId: testBlock.id } });

        await prisma.block.delete({ where: { id: testBlock.id } });
    }

    console.log("Cleanup complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
