import { Effect } from "effect";
import { CreateNeedRequest, NeedFilters } from "@/domain/Need";
import { decodeJsonBody, decodeWith, runHttp } from "@/lib/http";
import { DuplicateDetector } from "@/services/DuplicateDetector";
import { NeedsRepository } from "@/services/NeedsRepository";

export const dynamic = "force-dynamic";

/** GET /api/needs?category=&status= — list needs (critical-first). */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const raw: Record<string, string> = {};
  const category = params.get("category");
  const status = params.get("status");
  if (category) raw.category = category;
  if (status) raw.status = status;

  const program = Effect.gen(function* () {
    const filters = yield* decodeWith(NeedFilters)(raw);
    const repo = yield* NeedsRepository;
    return yield* repo.list(filters);
  });

  return runHttp(program);
}

/** POST /api/needs — create a need and return any nearby duplicate candidates. */
export async function POST(request: Request) {
  const program = Effect.gen(function* () {
    const input = yield* decodeJsonBody(request, CreateNeedRequest);
    const repo = yield* NeedsRepository;
    const detector = yield* DuplicateDetector;

    const need = yield* repo.create(input);
    const possibleDuplicates = yield* detector.findNearbyDuplicates({
      category: input.category,
      lat: input.lat,
      lng: input.lng,
    });

    // Exclude the row we just created from its own duplicate list.
    return {
      need,
      possibleDuplicates: possibleDuplicates.filter((c) => c.need.id !== need.id),
    };
  });

  return runHttp(program, 201);
}
