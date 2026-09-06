import { json, options } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/users";

export function OPTIONS() {
  return options();
}

export async function GET(request: Request) {
  try {
    const actor = await requireUser(request.headers.get("authorization"));
    const games = await prisma.game.findMany({
      where: actor.userType === "ADMIN" ? undefined : { userId: actor.id },
      include: { user: true },
      orderBy: { createdAt: "desc" }
    });
    return json(
      games.map((game) => ({
        id: game.id,
        user: { id: game.user.id, email: game.user.email },
        stake: game.stake,
        number_of_players: game.numberOfPlayers,
        service_fee: game.serviceFee,
        created_at: game.createdAt.toISOString()
      }))
    );
  } catch (err) {
    const status = (err as Error & { status?: number }).status || 400;
    return json({ detail: err instanceof Error ? err.message : "Failed" }, status);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireUser(request.headers.get("authorization"));
    const body = await request.json();
    const game = await prisma.game.create({
      data: {
        userId: actor.id,
        stake: Number(body.stake) || 0,
        numberOfPlayers: Number(body.number_of_players) || 0,
        serviceFee: Number(body.service_fee) || 0
      }
    });
    return json(
      {
        id: game.id,
        user: { id: actor.id, email: actor.email },
        stake: game.stake,
        number_of_players: game.numberOfPlayers,
        service_fee: game.serviceFee,
        created_at: game.createdAt.toISOString()
      },
      201
    );
  } catch (err) {
    const status = (err as Error & { status?: number }).status || 400;
    return json({ detail: err instanceof Error ? err.message : "Failed" }, status);
  }
}
