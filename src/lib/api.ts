import type { Product } from "@/domain/Catalog";
import type {
  CentroAcopio,
  ProductStatus,
  RegisterCentroRequest,
  RegistrationStatus,
  StockStatus,
} from "@/domain/Centro";

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
  /** Public: register a new centro (created as pending). */
  registerCentro: (payload: RegisterCentroRequest) =>
    request<CentroAcopio>("/api/centros", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Centro admin: log in with the centro id + its password. */
  loginCentro: (centroId: string, password: string) =>
    request<{ centro: CentroAcopio }>("/api/auth/centro", {
      method: "POST",
      body: JSON.stringify({ centroId, password }),
    }),

  /** Super admin: log in with the single operator password. */
  loginSuper: (password: string) =>
    request<{ ok: true }>("/api/auth/super", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  /** End the current session (either role). */
  logout: () =>
    request<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  /** Centro admin or super admin: add a missing item to the shared catalog. */
  createProduct: (name: string, categoryId: string) =>
    request<Product>("/api/catalog/products", {
      method: "POST",
      body: JSON.stringify({ name, categoryId }),
    }),

  /** Super admin: rename a product and/or move it to another category. */
  updateProduct: (id: string, patch: { name?: string; categoryId?: string }) =>
    request<Product>(`/api/admin/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  /** Super admin: remove a product from the shared catalog. */
  deleteProduct: (id: string) =>
    request<{ ok: true }>(`/api/admin/products/${id}`, { method: "DELETE" }),

  /** Super admin: assign a new admin password to a centro. */
  setCentroPassword: (id: string, password: string) =>
    request<{ ok: true }>(`/api/admin/centros/${id}/password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  /** Centro admin: set/update the stock status of a product for this centro. */
  setProductStatus: (slug: string, productId: string, status: StockStatus) =>
    request<ProductStatus>(`/api/centros/${slug}/status`, {
      method: "PATCH",
      body: JSON.stringify({ productId, status }),
    }),

  /** Super admin: approve / reject / disable / re-enable a centro. */
  setRegistration: (id: string, registrationStatus: RegistrationStatus) =>
    request<CentroAcopio>(`/api/admin/centros/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ registrationStatus }),
    }),
};

export { ApiError };
