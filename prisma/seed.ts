import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';
import { hash } from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ── Data Type Definitions ──────────────────────────────────────────────────
interface MemberData {
    firstName: string;
    lastName: string;
    team: string;
    startWeight: number | null;
    weights: (number | null)[];   // Week 1..9 absolute weights
    km: number[];                 // Week 1..9
    lifestyle: number[];          // Week 1..9
    attendance: Record<string, boolean>; // ISO date string -> present
}

interface ImportedData {
    members: MemberData[];
    sessionDates: string[]; // ISO date strings for all sessions
}

async function main() {
    console.log('Seeding TO\'A FATALONA data from Excel-parsed JSON...');

    // ── Clear existing data ────────────────────────────────────────────────
    console.log('Clearing old data...');

    // Clear in dependency order
    await prisma.pointLedger.deleteMany();
    await prisma.teamWeekAward.deleteMany();
    await prisma.teamWeekMetric.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.lifestyleLog.deleteMany();
    await prisma.kmLog.deleteMany();
    await prisma.weighIn.deleteMany();

    // Clear users that are participants (preserve admin)
    await prisma.user.deleteMany({ where: { role: 'participant' } });

    await prisma.member.deleteMany();
    await prisma.team.deleteMany();
    await prisma.session.deleteMany();
    await prisma.blockWeek.deleteMany();
    await prisma.block.deleteMany();

    console.log('Data cleared.');

    // ── Load Data ──────────────────────────────────────────────────────────
    const dataPath = path.join(__dirname, 'data', 'imported_data.json');
    if (!fs.existsSync(dataPath)) {
        console.error('Data file not found:', dataPath);
        return;
    }
    const importedData: ImportedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const members = importedData.members;
    const sessionDates = importedData.sessionDates;
    console.log(`Loaded ${members.length} members, ${sessionDates.length} sessions.`);

    // ── 1. Create Block ────────────────────────────────────────────────────
    const BLOCK_START = new Date('2026-01-19T00:00:00.000Z');
    const BLOCK_END = addDays(BLOCK_START, 63); // 9 weeks

    const currentBlock = await prisma.block.create({
        data: {
            name: 'Block 1 - 2026',
            startDate: BLOCK_START,
            endDate: BLOCK_END,
            isActive: true,
        },
    });
    console.log('Created Block:', currentBlock.name);

    // ── 2. Create Block Weeks ──────────────────────────────────────────────
    const blockWeeks = [];
    for (let i = 0; i < 9; i++) {
        const weekStart = addDays(BLOCK_START, i * 7);
        const weekEnd = addDays(weekStart, 7);
        const bw = await prisma.blockWeek.create({
            data: {
                blockId: currentBlock.id,
                weekNumber: i + 1,
                startDate: weekStart,
                endDate: weekEnd,
            },
        });
        blockWeeks.push(bw);
    }
    console.log(`Created ${blockWeeks.length} block weeks.`);

    // ── 3. Create Sessions (Mon/Wed/Fri across 8 weeks) ────────────────────
    // Build a map from ISO date -> session ID for quick lookup during attendance seeding
    const sessionMap: Record<string, string> = {}; // ISO date -> session.id

    // Determine the day type from session date
    const getDayType = (dateStr: string): string => {
        const d = new Date(dateStr);
        const day = d.getUTCDay(); // 0=Sun, 1=Mon, 3=Wed, 5=Fri
        if (day === 1) return 'Monday';
        if (day === 3) return 'Wednesday';
        if (day === 5) return 'Friday';
        return 'Other';
    };

    for (const dateStr of sessionDates) {
        const sessionDate = new Date(dateStr + 'T00:00:00.000Z');
        const sess = await prisma.session.create({
            data: {
                blockId: currentBlock.id,
                date: sessionDate,
                type: getDayType(dateStr),
            },
        });
        sessionMap[dateStr] = sess.id;
    }
    console.log(`Created ${sessionDates.length} sessions.`);

    // ── 4. Process Teams and Members ───────────────────────────────────────
    const teamCache: Record<string, string> = {}; // team name -> team id

    for (const record of members) {
        const teamName = record.team.trim();

        // Create team if not exists
        if (!teamCache[teamName]) {
            const team = await prisma.team.create({ data: { name: teamName } });
            teamCache[teamName] = team.id;
            console.log(`Created Team: ${teamName}`);
        }

        // Create Member
        const member = await prisma.member.create({
            data: {
                firstName: record.firstName,
                lastName: record.lastName,
                teamId: teamCache[teamName],
            },
        });

        // ── 4a. Weigh-Ins ──────────────────────────────────────────────────
        // Start weight (baseline)
        if (record.startWeight != null && record.startWeight > 0) {
            await prisma.weighIn.create({
                data: {
                    memberId: member.id,
                    date: BLOCK_START,
                    weight: record.startWeight,
                },
            });
        }
        // Per-week weights (Week 1 = index 0 in array → blockWeeks[0])
        for (let i = 0; i < 9; i++) {
            const w = record.weights[i];
            if (w != null && w > 0) {
                const weighInDate = addDays(BLOCK_START, (i + 1) * 7);
                await prisma.weighIn.create({
                    data: {
                        memberId: member.id,
                        date: weighInDate,
                        weight: w,
                    },
                });
            }
        }

        // ── 4b. KM Logs ────────────────────────────────────────────────────
        for (let i = 0; i < 9; i++) {
            const km = record.km[i] ?? 0;
            await prisma.kmLog.create({
                data: {
                    memberId: member.id,
                    blockWeekId: blockWeeks[i].id,
                    totalKm: km,
                },
            });
        }

        // ── 4c. Lifestyle Logs ─────────────────────────────────────────────
        for (let i = 0; i < 9; i++) {
            const posts = record.lifestyle[i] ?? 0;
            await prisma.lifestyleLog.create({
                data: {
                    memberId: member.id,
                    blockWeekId: blockWeeks[i].id,
                    postCount: posts,
                },
            });
        }

        // ── 4d. Attendance ─────────────────────────────────────────────────
        for (const [dateStr, isPresent] of Object.entries(record.attendance)) {
            const sessionId = sessionMap[dateStr];
            if (!sessionId) {
                console.warn(`  No session found for date ${dateStr}, skipping.`);
                continue;
            }
            await prisma.attendance.create({
                data: {
                    sessionId,
                    memberId: member.id,
                    isPresent,
                },
            });
        }

        console.log(`  Seeded: ${record.firstName} ${record.lastName} (${teamName})`);
    }

    // ── 5. Create Admin User ───────────────────────────────────────────────
    const adminPassword = await hash('password123', 12);
    await prisma.user.upsert({
        where: { email: 'admin@toafatalona.com' },
        update: {},
        create: {
            email: 'admin@toafatalona.com',
            password: adminPassword,
            role: 'admin',
            name: 'System Admin',
        },
    });
    console.log('Admin user upserted: admin@toafatalona.com (pw: password123)');

    // ── 6. Create Test Participant ─────────────────────────────────────────
    const firstMember = await prisma.member.findFirst({ orderBy: { createdAt: 'asc' } });
    if (firstMember) {
        const participantPassword = await hash('participant123', 12);
        await prisma.user.upsert({
            where: { email: 'participant@test.com' },
            update: {},
            create: {
                email: 'participant@test.com',
                password: participantPassword,
                role: 'participant',
                name: `${firstMember.firstName} ${firstMember.lastName}`,
                memberId: firstMember.id,
            },
        });
        console.log(`Test participant: participant@test.com (pw: participant123) → ${firstMember.firstName} ${firstMember.lastName}`);
    }

    console.log('\nSeeding completed successfully! ✓');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
