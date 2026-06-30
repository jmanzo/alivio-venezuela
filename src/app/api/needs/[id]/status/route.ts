import { Effect } from "effect";
import { UpdateStatusRequest } from "@/domain/Need";
import { decodeJsonBody, runHttp } from "@/lib/http";
import { NeedsRepository } from "@/services/NeedsRepository";

export const dynamic = "force-dynamic";

/** PATCH /api/needs/:id/status — transition a need to a new status. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const program = Effect.gen(function* () {
    const { id } = yield* Effect.promise(() => params);
    const body = yield* decodeJsonBody(request, UpdateStatusRequest);
    const repo = yield* NeedsRepository;
    return yield* repo.updateStatus(id, body.status, body.changedBy ?? null);
  });

  return runHttp(program);
}
