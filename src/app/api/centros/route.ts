import { Effect } from "effect";
import { NextResponse } from "next/server";
import { RegisterCentroRequest } from "@/domain/Centro";
import { decodeJsonBody, runHttp } from "@/lib/http";
import { isRateLimited, requestIp } from "@/lib/rate-limit";
import { CentrosRepository } from "@/services/CentrosRepository";

export const dynamic = "force-dynamic";

/** GET /api/centros — approved centros with a board summary each. */
export async function GET() {
  const program = Effect.gen(function* () {
    const repo = yield* CentrosRepository;
    return yield* repo.listApprovedSummaries();
  });

  return runHttp(program);
}

/** POST /api/centros — public registration of a new (pending) centro. */
export async function POST(request: Request) {
  // The only unauthenticated write in the app: blunt spam with a per-IP quota.
  if (isRateLimited(requestIp(request))) {
    return NextResponse.json(
      {
        error: "RateLimited",
        message:
          "Demasiados registros desde esta conexión. Intenta de nuevo en una hora.",
      },
      { status: 429 },
    );
  }

  const program = Effect.gen(function* () {
    const input = yield* decodeJsonBody(request, RegisterCentroRequest);
    const repo = yield* CentrosRepository;
    return yield* repo.register(input);
  });

  return runHttp(program, 201);
}
