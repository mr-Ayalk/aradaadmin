import type { User } from "@prisma/client";
import { prisma } from "./prisma";
import { authToken } from "./http";

export type { User };

export function publicUser(user: User | null) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    wallet: user.wallet,
    user_type: user.userType,
    usertype: user.userType,
    market: user.market,
    is_active: user.isActive,
    last_login: user.lastLogin ? user.lastLogin.toISOString() : null,
    created_at: user.createdAt.toISOString()
  };
}

export async function findUser(usernameOrEmail: string) {
  const key = String(usernameOrEmail || "").trim();
  if (!key) return null;
  return prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: key, mode: "insensitive" } },
        { username: { equals: key, mode: "insensitive" } }
      ]
    }
  });
}

export async function userFromAuth(header: string | null) {
  const token = authToken(header);
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });
  return session?.user ?? null;
}

export async function requireUser(header: string | null, admin = false) {
  const user = await userFromAuth(header);
  if (!user) {
    const err = new Error("Authentication credentials were not provided.");
    (err as Error & { status?: number }).status = 401;
    throw err;
  }
  if (admin && user.userType !== "ADMIN") {
    const err = new Error("Admin access required.");
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
  return user;
}

export async function setWallet(
  user: User,
  amount: number,
  actorEmail: string,
  computerName = "",
  note = "set"
) {
  const previous = user.wallet;
  const next = Number(amount) || 0;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { wallet: next }
  });
  await prisma.walletLog.create({
    data: {
      userId: user.id,
      email: user.email,
      previous,
      amount: next,
      delta: next - previous,
      actorEmail,
      computerName,
      note
    }
  });
  return updated;
}
