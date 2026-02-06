import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding TO’A FATALONA data...');

    // 1. Create Block 1
    // Start: Monday Jan 19, 2026
    // Duration: 8 weeks
    // End: March 16, 2026 (9th weigh-in)

    const BLOCK_START = new Date('2026-01-19T00:00:00.000Z');
    // 8 weeks * 7 days = 56 days. Jan 19 + 56 days = Mar 16.
    const BLOCK_END = addDays(BLOCK_START, 56);

    const block1 = await prisma.block.create({
        data: {
            name: 'Block 1 - 2026',
            startDate: BLOCK_START,
            endDate: BLOCK_END,
            isActive: true,
        },
    });

    console.log('Created Block:', block1.name);

    // 2. Create Block Weeks
    // Week 1: Jan 19 - Jan 26
    // Week 2: Jan 26 - Feb 2
    // ...
    for (let i = 0; i < 8; i++) {
        const weekStart = addDays(BLOCK_START, i * 7);
        const weekEnd = addDays(weekStart, 7);

        await prisma.blockWeek.create({
            data: {
                blockId: block1.id,
                weekNumber: i + 1,
                startDate: weekStart,
                endDate: weekEnd,
            },
        });
        console.log(`Created Week ${i + 1}: ${weekStart.toISOString().split('T')[0]} -> ${weekEnd.toISOString().split('T')[0]}`);
    }

    // 3. Create Sessions (Mon/Wed/Fri)
    // Interval: Jan 19 to Mar 13 (Fri before final Mon)
    // Or simply generate for the 8 weeks.

    const sessions = [];
    for (let i = 0; i < 8; i++) {
        const weekStart = addDays(BLOCK_START, i * 7);
        // Mon
        sessions.push({
            blockId: block1.id,
            date: weekStart,
            type: 'Monday'
        });
        // Wed
        sessions.push({
            blockId: block1.id,
            date: addDays(weekStart, 2),
            type: 'Wednesday'
        });
        // Fri
        sessions.push({
            blockId: block1.id,
            date: addDays(weekStart, 4),
            type: 'Friday'
        });
    }

    // Also include the very last Monday if it's a session? 
    // "Attendance for Mon/Wed/Fri sessions".
    // The block is 8 weeks. The 9th Monday (Mar 16) is the final weigh-in. 
    // Usually the session on the final weigh-in day might count, but effectively the training block is 8 weeks.
    // I will assume the Sessions cover the 8 weeks of training.
    // Last session would be Fri Mar 13.

    for (const s of sessions) {
        await prisma.session.create({
            data: s
        });
    }
    console.log(`Created ${sessions.length} sessions.`);

    // 4. Create Placeholder Teams
    const teams = [
        'Group A - TO’A',
        'Group B - FATALONA',
        'Group C - MANU',
        'Group D - KOA'
    ];

    for (const name of teams) {
        await prisma.team.create({
            data: { name }
        });
    }
    console.log('Created Teams.');

    // 5. Create Default Admin User
    // Email: admin@toafatalona.com
    // Password: password123
    const password = await hash('password123', 12);
    const user = await prisma.user.upsert({
        where: { email: 'admin@toafatalona.com' },
        update: {},
        create: {
            email: 'admin@toafatalona.com',
            password,
            role: 'admin'
        }
    });
    console.log({ user });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
