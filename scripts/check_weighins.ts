import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const members = await prisma.member.findMany({
        where: {
            OR: [
                { firstName: { contains: 'Taika', mode: 'insensitive' } },
                { firstName: { contains: 'Lasa', mode: 'insensitive' } },
            ],
        },
        include: {
            weighIns: {
                orderBy: { date: 'asc' },
            },
        },
    });

    console.log(JSON.stringify(members, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
