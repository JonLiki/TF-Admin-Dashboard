/**
 * Reset the admin user's password.
 *
 * Usage:
 *   node scripts/reset-admin-password.mjs                  # resets to "password123"
 *   node scripts/reset-admin-password.mjs MyNewPassword!   # resets to "MyNewPassword!"
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();
const ADMIN_EMAIL = 'admin@toafatalona.com';

async function main() {
    const newPassword = process.argv[2] || 'password123';

    const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

    if (!user) {
        console.error(`\n❌  Admin user (${ADMIN_EMAIL}) not found in the database.`);
        console.error('   Run "npx prisma db seed" first to create the admin user.\n');
        process.exit(1);
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: { password: hashed },
    });

    console.log('\n✅  Admin password has been reset successfully!');
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${newPassword}\n`);
}

main()
    .catch((e) => {
        console.error('Error resetting password:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
