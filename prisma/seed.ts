import { PrismaClient, Prisma } from '@prisma/client';
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
    await prisma.benchmarkLog.deleteMany();

    // Clear users that are participants (preserve admin)
    await prisma.user.deleteMany({ where: { role: 'PARTICIPANT' } });

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
    const BLOCK_END = addDays(BLOCK_START, 62); // 9 weeks, ending on the last Sunday

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
    // Weeks run Monday..Sunday. endDate must be the Sunday (start + 6), matching
    // createBlock() — an endDate of start + 7 lands on the next week's Monday and
    // makes date-range queries count Monday data in two weeks.
    for (let i = 0; i < 9; i++) {
        const weekStart = addDays(BLOCK_START, i * 7);
        const weekEnd = addDays(weekStart, 6);
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

    const weighInList: Prisma.WeighInCreateManyInput[] = [];
    const kmLogList: Prisma.KmLogCreateManyInput[] = [];
    const lifestyleLogList: Prisma.LifestyleLogCreateManyInput[] = [];
    const attendanceList: Prisma.AttendanceCreateManyInput[] = [];

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
            weighInList.push({
                memberId: member.id,
                date: BLOCK_START,
                weight: record.startWeight,
            });
        }
        // Per-week weights (Week 1 = index 0 in array → blockWeeks[0])
        for (let i = 0; i < 9; i++) {
            const w = record.weights[i];
            if (w != null && w > 0) {
                const weighInDate = addDays(BLOCK_START, (i + 1) * 7);
                weighInList.push({
                    memberId: member.id,
                    date: weighInDate,
                    weight: w,
                });
            }
        }

        // ── 4b. KM Logs ────────────────────────────────────────────────────
        for (let i = 0; i < 9; i++) {
            const km = record.km[i] ?? 0;
            kmLogList.push({
                memberId: member.id,
                blockWeekId: blockWeeks[i].id,
                totalKm: km,
            });
        }

        // ── 4c. Lifestyle Logs ─────────────────────────────────────────────
        for (let i = 0; i < 9; i++) {
            const posts = record.lifestyle[i] ?? 0;
            lifestyleLogList.push({
                memberId: member.id,
                blockWeekId: blockWeeks[i].id,
                postCount: posts,
            });
        }

        // ── 4d. Attendance ─────────────────────────────────────────────────
        for (const [dateStr, isPresent] of Object.entries(record.attendance)) {
            const sessionId = sessionMap[dateStr];
            if (!sessionId) {
                console.warn(`  No session found for date ${dateStr}, skipping.`);
                continue;
            }
            attendanceList.push({
                sessionId,
                memberId: member.id,
                isPresent,
            });
        }

        console.log(`  Processed: ${record.firstName} ${record.lastName} (${teamName})`);
    }

    console.log(`Inserting ${weighInList.length} weigh-in records in bulk...`);
    await prisma.weighIn.createMany({ data: weighInList });

    console.log(`Inserting ${kmLogList.length} KM log records in bulk...`);
    await prisma.kmLog.createMany({ data: kmLogList });

    console.log(`Inserting ${lifestyleLogList.length} lifestyle log records in bulk...`);
    await prisma.lifestyleLog.createMany({ data: lifestyleLogList });

    console.log(`Inserting ${attendanceList.length} attendance records in bulk...`);
    await prisma.attendance.createMany({ data: attendanceList });

    // ── 5. Create Admin User ───────────────────────────────────────────────
    const isProduction = process.env.NODE_ENV === 'production';
    const adminPlainPassword = process.env.SEED_ADMIN_PASSWORD;

    if (isProduction && !adminPlainPassword) {
        throw new Error(
            'Refusing to seed the default admin password in production. ' +
            'Set SEED_ADMIN_PASSWORD to seed the admin user.'
        );
    }

    const adminPassword = await hash(adminPlainPassword ?? 'password123', 12);
    await prisma.user.upsert({
        where: { email: 'admin@toafatalona.com' },
        update: {},
        create: {
            email: 'admin@toafatalona.com',
            password: adminPassword,
            role: 'ADMIN',
            name: 'System Admin',
        },
    });
    console.log(`Admin user upserted: admin@toafatalona.com${adminPlainPassword ? '' : ' (pw: password123)'}`);

    // ── 6. Create Test Participant (dev only) ──────────────────────────────
    const firstMember = await prisma.member.findFirst({ orderBy: { createdAt: 'asc' } });
    if (firstMember && !isProduction) {
        const participantPassword = await hash(process.env.SEED_PARTICIPANT_PASSWORD ?? 'participant123', 12);
        const participantData = {
            password: participantPassword,
            role: 'PARTICIPANT' as const,
            name: `${firstMember.firstName} ${firstMember.lastName}`,
            memberId: firstMember.id,
        };
        await prisma.user.upsert({
            where: { email: 'participant@test.com' },
            // Link memberId on update too, so a pre-existing participant row is
            // healed on re-seed (empty `update` left memberId unset → no dashboard).
            update: participantData,
            create: { email: 'participant@test.com', ...participantData },
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
