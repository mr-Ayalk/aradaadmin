import { json, options } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { publicUser, requireUser, setWallet } from "@/lib/users";

export function OPTIONS() {
  return options();
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request.headers.get("authorization"));
    const { id } = await context.params;
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) return json({ detail: "User not found" }, 404);
    return json(publicUser(user));
  } catch (err) {
    const status = (err as Error & { status?: number }).status || 400;
    return json({ detail: err instanceof Error ? err.message : "Failed" }, status);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireUser(request.headers.get("authorization"), true);
    const { id } = await context.params;
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) return json({ detail: "User not found" }, 404);
    const body = await request.json();
    let current = user;
    if (body.wallet !== undefined) {
      current = await setWallet(user, Number(body.wallet), actor.email, body.computer_name, "profile-patch");
    }
    current = await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: body.is_active !== undefined ? !!body.is_active : current.isActive,
        phone: body.phone !== undefined ? String(body.phone) : current.phone,
        market: body.market !== undefined ? String(body.market) : current.market
      }
    });
    return json(publicUser(current));
  } catch (err) {
    const status = (err as Error & { status?: number }).status || 400;
    return json({ detail: err instanceof Error ? err.message : "Failed" }, status);
  }
}
