import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const defaults = [
  {
    id: 1,
    email: "bam@gmail.com",
    username: "bam@gmail.com",
    password: "AradaAdmin@2026",
    wallet: 100000,
    userType: "ADMIN",
    market: "HQ",
    phone: "0000"
  },
  {
    id: 2,
    email: "arada@gmail.com",
    username: "arada@gmail.com",
    password: "6644",
    wallet: 0,
    userType: "USER",
    market: "trial-hall",
    phone: ""
  },
  {
    id: 3,
    email: "admin@arada.com",
    username: "admin@arada.com",
    password: "admin821361",
    wallet: 1,
    userType: "ADMIN",
    market: "local",
    phone: ""
  }
];

type LegacyUser = {
  id: number;
  username: string;
  email: string;
  phone?: string;
  passwordHash: string;
  wallet: number;
  user_type?: string;
  market?: string;
  is_active?: boolean;
  last_login?: string | null;
  created_at?: string;
};

async function main() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log("HQ already has users, skipping seed.");
    return;
  }

  const storePath = path.join(process.cwd(), "..", "hq-server", "data", "store.json");
  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, "utf8")) as { users?: LegacyUser[] };
    for (const user of store.users || []) {
      await prisma.user.create({
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone || "",
          passwordHash: user.passwordHash,
          wallet: Number(user.wallet) || 0,
          userType: (user.user_type || "USER").toUpperCase(),
          market: user.market || "hall",
          isActive: user.is_active !== false,
          lastLogin: user.last_login ? new Date(user.last_login) : null,
          createdAt: user.created_at ? new Date(user.created_at) : undefined
        }
      });
    }
    console.log(`Imported ${store.users?.length || 0} users from the local HQ store.`);
    return;
  }

  for (const user of defaults) {
    await prisma.user.create({
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        passwordHash: bcrypt.hashSync(user.password, 10),
        wallet: user.wallet,
        userType: user.userType,
        market: user.market
      }
    });
  }
  console.log("Seeded HQ admin bam@gmail.com / AradaAdmin@2026");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
