import bcrypt from "bcryptjs";
import crypto from "crypto";
import { json, options } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { findUser, publicUser } from "@/lib/users";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await findUser(body.username || body.email);
    if (!user || !user.isActive || !bcrypt.compareSync(String(body.password || ""), user.passwordHash)) {
      return json({ detail: "Invalid email or password", email: "Invalid email or password" }, 400);
    }
    const token = crypto.randomBytes(24).toString("hex");
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    await prisma.session.create({ data: { token, userId: user.id } });
    return json({ token, user: publicUser(updated) });
  } catch (err) {
    return json({ detail: err instanceof Error ? err.message : "Login failed" }, 400);
  }
}
