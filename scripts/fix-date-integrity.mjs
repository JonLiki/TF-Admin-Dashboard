/**
 * One-off backfill: normalize domain dates to UTC midnight and fix
 * overlapping week boundaries.
 *
 * What it fixes:
 *  1. Dates stored at server-LOCAL midnight (old setHours/startOfWeek code)
 *     instead of UTC midnight: Block, BlockWeek, Session, WeighIn, BenchmarkLog.
 *  2. WeighIn duplicates created by the local/UTC mismatch — when two records
 *     land on the same (memberId, UTC day), the most recently updated wins.
 *  3. BlockWeek rows spanning 7 days (endDate on the next Monday, old seed
 *     behavior) — endDate becomes startDate + 6 (Sunday).
 *  4. Block endDate landing on a Monday instead of the final Sunday.
 *
 * IMPORTANT: run this on a machine in the SAME timezone as the server that
 * wrote the data. A local-midnight timestamp is reinterpreted as "the local
 * calendar day of that instant", which is only correct in the original zone.
 *
 * Usage:
 *   node scripts/fix-date-integrity.mjs           # dry run, prints planned changes
 *   node scripts/fix-date-integrity.mjs --apply   # write the changes
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC midnight of the LOCAL calendar day of the given instant. */
function normalize(d) {
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function isUtcMidnight(d) {
    return d.getTime() % DAY_MS === 0;
}

const iso = (d) => d.toISOString();
let changes = 0;

function plan(message) {
    changes++;
    console.log(`${APPLY ? 'FIX' : 'WOULD FIX'}: ${message}`);
}

async function normalizeSimpleDates() {
    // Model name -> date fields to normalize
    const targets = [
        ['block', ['startDate', 'endDate']],
        ['blockWeek', ['startDate', 'endDate']],
        ['session', ['date']],
        ['benchmarkLog', ['date']],
    ];

    for (const [model, fields] of targets) {
        const rows = await prisma[model].findMany();
        for (const row of rows) {
            const data = {};
            for (const field of fields) {
                const value = row[field];
                if (!isUtcMidnight(value)) {
                    data[field] = normalize(value);
                    plan(`${model} ${row.id} ${field}: ${iso(value)} -> ${iso(data[field])}`);
                }
            }
            if (Object.keys(data).length > 0 && APPLY) {
                await prisma[model].update({ where: { id: row.id }, data });
            }
        }
    }
}

async function normalizeWeighIns() {
    const rows = await prisma.weighIn.findMany({ orderBy: { updatedAt: 'asc' } });

    // Group by (memberId, normalized day); later updatedAt wins on conflict.
    const byKey = new Map();
    for (const row of rows) {
        const target = normalize(row.date);
        const key = `${row.memberId}_${target.getTime()}`;
        const existing = byKey.get(key);
        if (existing) {
            // rows are sorted by updatedAt asc, so `row` is the newer record
            plan(`weighIn duplicate for member ${row.memberId} on ${iso(target)}: ` +
                `keeping weight ${row.weight} (newer), deleting record ${existing.row.id} (weight ${existing.row.weight})`);
            existing.deleteIds.push(existing.row.id);
            existing.row = row;
        } else {
            byKey.set(key, { row, target, deleteIds: [] });
        }
    }

    for (const { row, target, deleteIds } of byKey.values()) {
        if (APPLY) {
            for (const id of deleteIds) {
                await prisma.weighIn.delete({ where: { id } });
            }
        }
        if (row.date.getTime() !== target.getTime()) {
            plan(`weighIn ${row.id} date: ${iso(row.date)} -> ${iso(target)}`);
            if (APPLY) {
                await prisma.weighIn.update({ where: { id: row.id }, data: { date: target } });
            }
        }
    }
}

async function fixWeekSpans() {
    const weeks = await prisma.blockWeek.findMany();
    for (const week of weeks) {
        const span = normalize(week.endDate).getTime() - normalize(week.startDate).getTime();
        if (span === 7 * DAY_MS) {
            const newEnd = new Date(normalize(week.startDate).getTime() + 6 * DAY_MS);
            plan(`blockWeek ${week.id} (week ${week.weekNumber}) endDate: ${iso(week.endDate)} -> ${iso(newEnd)} (was overlapping next week's Monday)`);
            if (APPLY) {
                await prisma.blockWeek.update({ where: { id: week.id }, data: { endDate: newEnd } });
            }
        }
    }

    const blocks = await prisma.block.findMany();
    for (const block of blocks) {
        const span = normalize(block.endDate).getTime() - normalize(block.startDate).getTime();
        if (span % (7 * DAY_MS) === 0) {
            const newEnd = new Date(normalize(block.endDate).getTime() - DAY_MS);
            plan(`block ${block.id} ("${block.name}") endDate: ${iso(block.endDate)} -> ${iso(newEnd)} (block should end on the final Sunday)`);
            if (APPLY) {
                await prisma.block.update({ where: { id: block.id }, data: { endDate: newEnd } });
            }
        }
    }
}

async function main() {
    console.log(APPLY ? 'Applying date integrity fixes...' : 'DRY RUN — pass --apply to write changes.\n');

    await normalizeSimpleDates();
    await normalizeWeighIns();
    await fixWeekSpans();

    if (changes === 0) {
        console.log('No issues found — all dates are UTC midnight with Monday–Sunday weeks.');
    } else {
        console.log(`\n${changes} issue(s) ${APPLY ? 'fixed' : 'found'}.`);
        if (!APPLY) console.log('Re-run with --apply to write these changes.');
    }
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
