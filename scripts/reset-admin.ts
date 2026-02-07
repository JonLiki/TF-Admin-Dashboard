import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error('Usage: npx ts-node scripts/reset-admin.ts <email> <password>');
        process.exit(1);
    }

    const email = args[0];
    const password = args[1];

    console.log(`Updating credentials for user: ${email}...`);

    const hashedPassword = await hash(password, 12);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        // Update existing user
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log('Password updated successfully.');
    } else {
        // Create new admin user
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'admin'
            }
        });
        console.log('New admin user created successfully.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
