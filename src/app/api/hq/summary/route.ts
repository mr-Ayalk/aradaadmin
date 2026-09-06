import { json, options } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/users";

export function OPTIONS() {
  return options();
}

export async function GET(request: Request) {
  try {
    await requireUser(request.headers.get("authorization"), true);
    const users = await prisma.user.findMany();
    const agents = users.filter((user) => user.userType === "USER");
    const recentLogs = await prisma.walletLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });
    return json({
      totalUsers: users.length,
      totalAgents: agents.length,
      totalWallet: users.reduce((sum, user) => sum + user.wallet, 0),
      agentWallet: agents.reduce((sum, user) => sum + user.wallet, 0),
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        userId: log.userId,
        email: log.email,
        previous: log.previous,
        amount: log.amount,
        delta: log.delta,
        actorEmail: log.actorEmail,
        computer_name: log.computerName,
        note: log.note,
        createdAt: log.createdAt.toISOString()
      }))
    });
  } catch (err) {
    const status = (err as Error & { status?: number }).status || 400;
    return json({ detail: err instanceof Error ? err.message : "Failed" }, status);
  }
}
