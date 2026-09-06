import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE((SELECT MAX(id) FROM "User"), 1))`
  );
  const result = await prisma.$queryRawUnsafe<{ max: number }[]>(
    `SELECT MAX(id) as max FROM "User"`
  );
  console.log("User id sequence reset. Max id:", result[0]?.max);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
