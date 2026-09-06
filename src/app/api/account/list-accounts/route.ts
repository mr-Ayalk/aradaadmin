import { json, options } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { publicUser, requireUser } from "@/lib/users";

export function OPTIONS() {
  return options();
}

export async function GET(request: Request) {
  try {
    await requireUser(request.headers.get("authorization"), true);
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    return json(users.map(publicUser));
  } catch (err) {
    const status = (err as Error & { status?: number }).status || 400;
    return json({ detail: err instanceof Error ? err.message : "Failed" }, status);
  }
}
