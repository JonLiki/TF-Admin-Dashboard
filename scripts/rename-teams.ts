
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Renaming Teams to Groups...");
    const teams = await prisma.team.findMany();

    for (const team of teams) {
        if (team.name.startsWith("Team")) {
            const newName = team.name.replace("Team", "Group");
            console.log(`Renaming "${team.name}" -> "${newName}"`);
            await prisma.team.update({
                where: { id: team.id },
                data: { name: newName }
            });
        }
    }
    console.log("Done.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
