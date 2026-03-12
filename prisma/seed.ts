import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';
import { hash } from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Data Type Definition
interface MemberData {
    name: string;
    team: string;
    metrics?: {
        weight?: string[];
        km?: string[];
        lifestyle?: string[];
        attendance?: string[];
    }
    // flattened in JSON
    weight?: string[];
    km?: string[];
    lifestyle?: string[];
    attendance?: string[];
}

async function main() {
    console.log('Seeding TO’A FATALONA data from extracted PDF...');

    // Clear existing data to avoid duplicates from previous bad seeds
    // Clear existing data to avoid duplicates from previous bad seeds
    console.log('Clearing old data...');
    // Delete dependencies first
    await prisma.pointLedger.deleteMany();
    await prisma.teamWeekAward.deleteMany();
    await prisma.teamWeekMetric.deleteMany();

    await prisma.attendance.deleteMany();
    await prisma.lifestyleLog.deleteMany();
    await prisma.kmLog.deleteMany();
    await prisma.weighIn.deleteMany();

    await prisma.member.deleteMany();
    await prisma.team.deleteMany();

    await prisma.session.deleteMany(); // Attendance gone
    await prisma.blockWeek.deleteMany(); // Metrics gone
    await prisma.block.deleteMany();
    console.log('Data cleared.');
    await prisma.session.deleteMany();
    await prisma.blockWeek.deleteMany();
    await prisma.block.deleteMany();
    console.log('Data cleared.');

    // 0. Load Data
    const dataPath = path.join(__dirname, 'data', 'imported_data.json');
    if (!fs.existsSync(dataPath)) {
        console.error("Data file not found:", dataPath);
        return;
    }
    const importedData: MemberData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`Loaded ${importedData.length} records.`);

    // 1. Create Block (Same as before)
    const BLOCK_START = new Date('2026-01-19T00:00:00.000Z');
    const BLOCK_END = addDays(BLOCK_START, 56); // 8 weeks

    await prisma.block.updateMany({
        where: { isActive: true },
        data: { isActive: false }
    }); // Deactivate others if any

    // Upsert Block
    // Find or create block by name/date to avoid duplicates on re-seed
    let currentBlock = await prisma.block.findFirst({
        where: { name: 'Block 1 - 2026' }
    });

    if (!currentBlock) {
        currentBlock = await prisma.block.create({
            data: {
                name: 'Block 1 - 2026',
                startDate: BLOCK_START,
                endDate: BLOCK_END,
                isActive: true,
            },
        });
        console.log('Created Block:', currentBlock.name);
    } else {
        console.log('Using existing Block:', currentBlock.name);
    }


    // 2. Create Weeks & Sessions
    // We need these to link logs
    // Weeks 1-8
    const blockWeeks = [];
    for (let i = 0; i < 8; i++) {
        const weekStart = addDays(BLOCK_START, i * 7);
        const weekEnd = addDays(weekStart, 7);

        // Upsert Week
        // Complex upsert often easiest by findFirst then create/update
        let bw = await prisma.blockWeek.findFirst({
            where: { blockId: currentBlock.id, weekNumber: i + 1 }
        });
        if (!bw) {
            bw = await prisma.blockWeek.create({
                data: {
                    blockId: currentBlock.id,
                    weekNumber: i + 1,
                    startDate: weekStart,
                    endDate: weekEnd,
                },
            });
        }
        blockWeeks.push(bw);

        // Create Sessions for this week (Mon, Wed, Fri)
        const sessionDays = [0, 2, 4]; // Days offset from start (Mon)
        const types = ['Monday', 'Wednesday', 'Friday'];

        for (let j = 0; j < 3; j++) {
            const date = addDays(weekStart, sessionDays[j]);
            const existingSession = await prisma.session.findFirst({
                where: { blockId: currentBlock.id, date: date }
            });
            if (!existingSession) {
                await prisma.session.create({
                    data: {
                        blockId: currentBlock.id,
                        date: date,
                        type: types[j]
                    }
                });
            }
        }
    }

    // 3. Process Teams and Members
    // Cache teams to reduce DB calls
    const teamCache: Record<string, string> = {}; // Name -> ID

    for (const record of importedData) {
        // Fix Team Name if needed
        const teamName = record.team.trim();

        if (!teamCache[teamName]) {
            let team = await prisma.team.findFirst({ where: { name: teamName } });
            if (!team) {
                team = await prisma.team.create({ data: { name: teamName } });
                console.log(`Created Team: ${teamName}`);
            }
            teamCache[teamName] = team.id;
        }

        // Upsert Member
        const memberName = record.name.trim();
        let member = await prisma.member.findFirst({
            where: { firstName: memberName } // Simplified matching
        });

        // Split name for better quality
        const nameParts = memberName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '-';

        if (!member) {
            // Try matching by combined name?
            // Usually findFirst with firstName + lastName
            member = await prisma.member.create({
                data: {
                    firstName: memberName, // Store full name in first for now or split
                    lastName: '', // Hack if schema requires it. Schema says firstName, lastName string.
                    teamId: teamCache[teamName]
                }
            });
            // Update to use valid first/last
            await prisma.member.update({
                where: { id: member.id },
                data: { firstName, lastName }
            });
        } else {
            // Update team if changed
            if (member.teamId !== teamCache[teamName]) {
                await prisma.member.update({
                    where: { id: member.id },
                    data: { teamId: teamCache[teamName] }
                });
            }
        }

        // 4. Insert Metrics per Week
        // record.weight -> ["Start", "W1", "W2"...] (Absolute values now)
        // record.km -> ["-", "W1", "W2"...]
        // record.lifestyle -> ["?", "W1", "W2"...]
        // record.attendance -> ["W1", "W2"... "?", "Total"]

        // Setup initial weight logic
        // Data format: [Start, Abs1, Abs2...]

        const weightData = record.weight || [];
        if (weightData.length > 0) {
            const startStr = weightData[0];
            // Clean string
            const val = parseFloat(startStr.replace(/[^\d.-]/g, ''));
            if (!isNaN(val) && val > 0) {
                // Record Start Weight (Week 0 / Baseline)
                // Use Block Start Date
                await prisma.weighIn.upsert({
                    where: { memberId_date: { memberId: member.id, date: BLOCK_START } },
                    update: { weight: val },
                    create: { memberId: member.id, date: BLOCK_START, weight: val }
                });
            }
        }

        // Loop weeks 1..8
        // Arrays might be shorter or longer.

        for (let i = 0; i < 8; i++) {
            const weekIndex = i + 1; // 1-based week
            const bw = blockWeeks[i];

            // --- Weight ---
            // Index 1 corresponds to Week 1 weight
            if (weightData.length > weekIndex) {
                const rawWeight = weightData[weekIndex];
                if (rawWeight && rawWeight !== '-') {
                    const weight = parseFloat(rawWeight.replace(/[^\d.-]/g, ''));
                    if (!isNaN(weight)) {
                        // Date: Start + (i+1)*7 days.
                        const weighInDate = addDays(BLOCK_START, (i + 1) * 7);

                        await prisma.weighIn.upsert({
                            where: { memberId_date: { memberId: member.id, date: weighInDate } },
                            update: { weight: weight },
                            create: { memberId: member.id, date: weighInDate, weight: weight }
                        });
                    }
                }
            }

            // --- KM ---
            // Index 1 corresponds to Week 1
            const kmData = record.km || [];
            if (kmData.length > weekIndex) {
                const rawKm = kmData[weekIndex];
                if (rawKm && rawKm !== '-') {
                    const val = parseFloat(rawKm.replace(/[^\d.-]/g, ''));
                    if (!isNaN(val)) {
                        await prisma.kmLog.upsert({
                            where: { memberId_blockWeekId: { memberId: member.id, blockWeekId: bw.id } },
                            update: { totalKm: val },
                            create: { memberId: member.id, blockWeekId: bw.id, totalKm: val }
                        });
                    }
                }
            }

            // --- Lifestyle ---
            const lifeData = record.lifestyle || [];
            if (lifeData.length > weekIndex) {
                const rawLife = lifeData[weekIndex];
                // Format: "5" or "5/5" or just number
                if (rawLife && rawLife !== '-') {
                    const val = parseInt(rawLife.replace(/[^\d]/g, ''));
                    if (!isNaN(val)) {
                        await prisma.lifestyleLog.upsert({
                            where: { memberId_blockWeekId: { memberId: member.id, blockWeekId: bw.id } },
                            update: { postCount: val },
                            create: { memberId: member.id, blockWeekId: bw.id, postCount: val }
                        });
                    }
                }
            }

            // --- Attendance ---
            // Format: "3/3", "2/3"
            // Determine sessions to mark present
            /* 
            // ATTENDANCE REMOVED FOR MANUAL ENTRY
            const attData = record.attendance || [];
            // Array is directly week 1, week 2 index?
            // JSON showed: ["3/3", "3/3"... "12"]
            // Index 0 -> Week 1?
            // Let's assume Index 0 is Week 1.

            const attIndex = i; // 0-based for this array based on JSON inspection
            if (attData.length > attIndex) {
               const rawAtt = attData[attIndex];
               if (rawAtt && rawAtt.includes('/')) {
                   const [attended, total] = rawAtt.split('/').map(s => parseInt(s));
                   if (!isNaN(attended) && attended > 0) {
                       // Find sessions for this week
                       // We created them earlier: Mon, Wed, Fri
                       // We need their IDs
                       const weekStart = addDays(BLOCK_START, i * 7);

                       // Get sessions sorted by date
                       const sessions = await prisma.session.findMany({
                           where: {
                               blockId: currentBlock.id,
                               date: { gte: weekStart, lt: addDays(weekStart, 7) }
                           },
                           orderBy: { date: 'asc' }
                       });

                       // Mark first N as present
                       for (let k = 0; k < attended && k < sessions.length; k++) {
                           const sess = sessions[k];
                           await prisma.attendance.upsert({
                               where: { sessionId_memberId: { sessionId: sess.id, memberId: member.id } },
                               update: { isPresent: true },
                               create: { sessionId: sess.id, memberId: member.id, isPresent: true }
                           });
                       }
                   }
               }
            }
            */
        }
    }

    // 5. Create Admin (Preserve)
    const password = await hash('password123', 12);
    await prisma.user.upsert({
        where: { email: 'admin@toafatalona.com' },
        update: {},
        create: {
            email: 'admin@toafatalona.com',
            password,
            role: 'admin'
        }
    });

    console.log('Seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

