
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Debugging Attendance...");

    // 1. Get the latest BlockWeek
    const block = await prisma.block.findFirst({
        where: { isActive: true },
        include: { weeks: { orderBy: { weekNumber: 'asc' } } }
    });

    if (!block) {
        console.log("No active block found.");
        return;
    }

    const week = block.weeks[0]; // Assuming week 1 for now, or last one
    console.log(`Checking Week ${week.weekNumber} (${week.id})`);
    console.log(`Range: ${week.startDate.toISOString()} - ${week.endDate.toISOString()}`);

    // 2. Check Attendance Records in this range
    const attendance = await prisma.attendance.findMany({
        where: {
            isPresent: true,
            session: {
                date: {
                    gte: week.startDate,
                    lte: week.endDate
                }
            }
        },
        include: { member: true, session: true }
    });

    console.log(`Found ${attendance.length} attendance records in this range.`);
    attendance.forEach(a => {
        console.log(` - ${a.member.firstName} @ ${a.session.date.toISOString()} (${a.session.type})`);
    });

    // 3. Check TeamWeekMetrics
    const metrics = await prisma.teamWeekMetric.findMany({
        where: { blockWeekId: week.id },
        include: { team: true }
    });

    console.log("\nCurrent Metrics in DB:");
    metrics.forEach(m => {
        console.log(` - Team: ${m.team.name}, AttendanceAvg: ${m.attendanceAverage}`);
    });

    // 4. Manual Recalculation Check for first team
    if (metrics.length > 0) {
        const teamId = metrics[0].teamId;
        const members = await prisma.member.findMany({ where: { teamId, isActive: true } });
        console.log(`\nManual Check for Team ${metrics[0].team.name} (ID: ${teamId}):`);
        console.log(`Member Count: ${members.length}`);

        const teamAttendance = attendance.filter(a => a.member.teamId === teamId);
        console.log(`Team Attendance Count: ${teamAttendance.length}`);

        const calcAvg = members.length > 0 ? teamAttendance.length / members.length : 0;
        console.log(`Calculated Avg: ${calcAvg}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
