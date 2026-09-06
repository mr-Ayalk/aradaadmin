import bcrypt from "bcryptjs";
import { json, options } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { findUser, publicUser } from "@/lib/users";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || body.username || "").trim();
    const password = String(body.password || "");
    if (!email) return json({ detail: "Email is required", email: "Email is required" }, 400);
    if (!password) return json({ detail: "Password is required" }, 400);
    if (await findUser(email)) {
      return json({ detail: "User already exists", email: "User already exists" }, 400);
    }
    const userType = String(body.user_type || body.usertype || "USER").toUpperCase();
    const wallet = Number(body.wallet) || 0;
    const user = await prisma.user.create({
      data: {
        username: body.username || email,
        email,
        phone: body.phone || "",
        passwordHash: bcrypt.hashSync(password, 10),
        wallet,
        userType,
        market: body.market || "hall"
      }
    });
    await prisma.walletLog.create({
      data: {
        userId: user.id,
        email: user.email,
        previous: 0,
        amount: wallet,
        delta: wallet,
        actorEmail: "signup",
        note: "created"
      }
    });
    return json(publicUser(user), 201);
  } catch (err) {
    return json({
      detail: err instanceof Error ? err.message : "Signup failed",
      email: err instanceof Error ? err.message : "Signup failed"
    }, 400);
  }
}
