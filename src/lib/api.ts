import type {
  Category,
  CreateNeedRequest,
  Need,
  NeedStatus,
} from "@/domain/Need";

export interface DuplicateCandidate {
  need: Need;
  distanceKm: number;
}

export interface CreateNeedResult {
  need: Need;
  possibleDuplicates: DuplicateCandidate[];
}

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (body && typeof body.message === "string" && body.message) ||
      `La solicitud falló (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return body as T;
}

export const api = {
  listNeeds: () => request<Need[]>("/api/needs"),

  createNeed: (payload: CreateNeedRequest) =>
    request<CreateNeedResult>("/api/needs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateStatus: (id: string, status: NeedStatus, changedBy?: string | null) =>
    request<Need>(`/api/needs/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, changedBy: changedBy ?? null }),
    }),

  checkDuplicates: (input: { category: Category; lat: number; lng: number }) =>
    request<{ possibleDuplicates: DuplicateCandidate[] }>(
      "/api/needs/check-duplicates",
      { method: "POST", body: JSON.stringify(input) },
    ),
};

export { ApiError };
