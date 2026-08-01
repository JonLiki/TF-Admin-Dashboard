import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
    // 1. Find all admin users
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, email: true, name: true, role: true, password: true },
    });

    console.log(`\n=== Admin Users Found: ${admins.length} ===`);
    for (const u of admins) {
        console.log(`  Email: ${u.email}`);
        console.log(`  Name: ${u.name}`);
        console.log(`  Role: ${u.role}`);
        console.log(`  Has password: ${!!u.password} (length: ${u.password?.length})`);

        // 2. Test if "password123" matches
        if (u.password) {
            const matches = await bcrypt.compare('password123', u.password);
            console.log(`  "password123" matches: ${matches}`);
        }
        console.log('');
    }

    // 3. Also check by exact email
    const byEmail = await prisma.user.findUnique({
        where: { email: 'admin@toafatalona.com' },
        select: { id: true, email: true, role: true, password: true },
    });
    console.log('=== Lookup by email "admin@toafatalona.com" ===');
    console.log(byEmail ? `  Found: ${byEmail.email}, role: ${byEmail.role}` : '  NOT FOUND');

    // 4. Show all users for reference
    const allUsers = await prisma.user.findMany({
        select: { email: true, role: true, name: true },
    });
    console.log(`\n=== All Users (${allUsers.length}) ===`);
    for (const u of allUsers) {
        console.log(`  ${u.email} | ${u.role} | ${u.name}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
