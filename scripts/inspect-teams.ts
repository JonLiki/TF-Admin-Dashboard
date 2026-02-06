
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Listing current teams:");
    const teams = await prisma.team.findMany();
    teams.forEach(t => console.log(`- "${t.name}"`));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
