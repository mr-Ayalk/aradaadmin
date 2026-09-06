import { json, options } from "@/lib/http";
import { publicUser, requireUser } from "@/lib/users";

export function OPTIONS() {
  return options();
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(request.headers.get("authorization"));
    return json(publicUser(user));
  } catch (err) {
    const status = (err as Error & { status?: number }).status || 400;
    return json({ detail: err instanceof Error ? err.message : "Failed" }, status);
  }
}
