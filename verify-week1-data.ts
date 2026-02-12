
import prisma from './src/lib/prisma';

async function main() {
    // Get Active Block
    const block = await prisma.block.findFirst({
        where: { isActive: true },
        include: { weeks: { orderBy: { weekNumber: 'asc' } } }
    });

    if (!block || block.weeks.length === 0) {
        console.log("No active block");
        return;
    }

    const week1 = block.weeks[0];
    console.log(`Checking Week 1: ${week1.startDate.toISOString()} to ${week1.endDate.toISOString()}`);

    // Get a team (e.g. Group 1)
    const teams = await prisma.team.findMany({
        include: {
            members: {
                include: {
                    weighIns: true
                }
            }
        }
    });

    for (const team of teams) {
        console.log(`\nTeam: ${team.name}`);
        let validPairs = 0;
        for (const member of team.members) {
            // Filter weigh-ins in Week 1
            const weekWeighIns = member.weighIns.filter(w =>
                w.date >= week1.startDate && w.date < week1.endDate
            ).sort((a, b) => a.date.getTime() - b.date.getTime());

            if (weekWeighIns.length > 0) {
                console.log(`  Member ${member.firstName}: ${weekWeighIns.length} weigh-ins.`);
                weekWeighIns.forEach(w => console.log(`    - ${w.date.toISOString()} : ${w.weight}kg`));

                if (weekWeighIns.length >= 2) validPairs++;
            }
        }
        console.log(`  -> Members with >=2 weigh-ins: ${validPairs}`);
    }
}

main();
