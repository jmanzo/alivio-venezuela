import { Effect, Schema } from "effect";
import { Category } from "@/domain/Need";
import { decodeJsonBody, runHttp } from "@/lib/http";
import { DuplicateDetector } from "@/services/DuplicateDetector";

export const dynamic = "force-dynamic";

const CheckRequest = Schema.Struct({
  category: Category,
  lat: Schema.Number.pipe(Schema.between(-90, 90)),
  lng: Schema.Number.pipe(Schema.between(-180, 180)),
});

/** POST /api/needs/check-duplicates — soft duplicate check before submitting. */
export async function POST(request: Request) {
  const program = Effect.gen(function* () {
    const input = yield* decodeJsonBody(request, CheckRequest);
    const detector = yield* DuplicateDetector;
    const possibleDuplicates = yield* detector.findNearbyDuplicates(input);
    return { possibleDuplicates };
  });

  return runHttp(program);
}
