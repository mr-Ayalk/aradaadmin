import { prisma } from "./prisma";

export async function syncUserIdSequence() {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE((SELECT MAX(id) FROM "User"), 1))`
  );
}
