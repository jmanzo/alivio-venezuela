import { Context, Effect, Layer } from "effect";
import type { DatabaseError } from "@/domain/errors";
import type { Category, Need } from "@/domain/Need";
import { DUPLICATE_RADIUS_KM, distanceKm } from "@/lib/geo";
import { NeedsRepository } from "./NeedsRepository";

export interface DuplicateCandidate {
  readonly need: Need;
  readonly distanceKm: number;
}

export interface DuplicateDetectorShape {
  /**
   * Finds open / in-progress needs of the same category within
   * `DUPLICATE_RADIUS_KM`. This FLAGS — it never blocks — so the report flow can
   * surface a soft warning before submission.
   */
  readonly findNearbyDuplicates: (input: {
    category: Category;
    lat: number;
    lng: number;
  }) => Effect.Effect<ReadonlyArray<DuplicateCandidate>, DatabaseError>;
}

export class DuplicateDetector extends Context.Tag("DuplicateDetector")<
  DuplicateDetector,
  DuplicateDetectorShape
>() {}

export const DuplicateDetectorLive = Layer.effect(
  DuplicateDetector,
  Effect.gen(function* () {
    const repo = yield* NeedsRepository;

    return DuplicateDetector.of({
      findNearbyDuplicates: ({ category, lat, lng }) =>
        Effect.gen(function* () {
          const candidates = yield* repo.listActiveByCategory(category);
          return candidates
            .map((need) => ({ need, distanceKm: distanceKm({ lat, lng }, need) }))
            .filter((c) => c.distanceKm <= DUPLICATE_RADIUS_KM)
            .sort((a, b) => a.distanceKm - b.distanceKm);
        }),
    });
  }),
);
