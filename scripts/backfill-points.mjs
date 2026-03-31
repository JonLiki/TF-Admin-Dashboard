import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Starting backfill...");
  const blocks = await prisma.block.findMany({ orderBy: { createdAt: 'asc' } });
  if (blocks.length === 0) {
    console.log("No blocks found");
    return;
  }
  const firstBlock = blocks[0];
  console.log("Backfilling points to block:", firstBlock.name, firstBlock.id);

  const res = await prisma.pointLedger.updateMany({
    where: { blockId: null },
    data: { blockId: firstBlock.id }
  });
  console.log(`Updated ${res.count} records.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
