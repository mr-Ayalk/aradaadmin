import { json, options } from "@/lib/http";
import { findUser, publicUser, requireUser, setWallet } from "@/lib/users";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  try {
    const actor = await requireUser(request.headers.get("authorization"), true);
    const body = await request.json();
    const user = await findUser(body.username || body.email);
    if (!user) return json({ detail: "User not found" }, 404);
    const incoming = Number(body.amount);
    if (Number.isNaN(incoming)) return json({ detail: "Amount is required" }, 400);
    const mode = String(body.mode || "set").toLowerCase();
    const next = mode === "add" ? user.wallet + incoming : incoming;
    const updated = await setWallet(user, next, actor.email, body.computer_name || "", mode);
    return json({ ok: true, user: publicUser(updated) });
  } catch (err) {
    const status = (err as Error & { status?: number }).status || 400;
    return json({ detail: err instanceof Error ? err.message : "Failed" }, status);
  }
}
