
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Renaming TEAM/Team to Group...");
    const teams = await prisma.team.findMany();

    for (const team of teams) {
        let newName = team.name;
        // Check for uppercase TEAM
        if (newName.includes("TEAM")) {
            newName = newName.replace("TEAM", "Group"); // Replacing uppercase TEAM with Title Case Group per user request "Group 1"
        }
        // Check for Title Case Team (just in case)
        else if (newName.includes("Team")) {
            newName = newName.replace("Team", "Group");
        }

        if (newName !== team.name) {
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
