import { Effect } from "effect";
import { RegisterCentroRequest } from "@/domain/Centro";
import { decodeJsonBody, runHttp } from "@/lib/http";
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
  const program = Effect.gen(function* () {
    const input = yield* decodeJsonBody(request, RegisterCentroRequest);
    const repo = yield* CentrosRepository;
    return yield* repo.register(input);
  });

  return runHttp(program, 201);
}
