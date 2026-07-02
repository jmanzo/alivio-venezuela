import { Effect, Layer } from "effect";
import { Category, Product } from "@/domain/Catalog";
import {
  CentroAcopio,
  type CentroSummary,
  ProductStatus,
  type RegistrationStatus,
  type StockStatus,
} from "@/domain/Centro";
import { AuthError, NotFoundError } from "@/domain/errors";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { slugify } from "@/lib/format";
import {
  CatalogRepository,
  type CatalogRepositoryShape,
} from "./CatalogRepository";
import {
  CentrosRepository,
  type CentrosRepositoryShape,
} from "./CentrosRepository";
import {
  ProductStatusRepository,
  type ProductStatusRepositoryShape,
} from "./ProductStatusRepository";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "./seed";

/**
 * In-memory repositories used when Supabase credentials are absent. They keep
 * the whole app usable (browse / register / approve / edit statuses) for local
 * demos and as a graceful fallback on the deployed URL before the database is
 * wired. Realtime cross-client sync is unavailable in this mode.
 */

const categories: Category[] = SEED_CATEGORIES.map(
  (c, i) => new Category({ id: c.id, name: c.name, sortOrder: i }),
);

const products: Product[] = SEED_PRODUCTS.map(
  (p, i) =>
    new Product({
      id: crypto.randomUUID(),
      categoryId: p.categoryId,
      name: p.name,
      sortOrder: i,
    }),
);

// Password hashes live outside the domain object, keyed by centro id.
const passwordHashes = new Map<string, string>();

const demoCentro = new CentroAcopio({
  id: crypto.randomUUID(),
  name: "Centro de Acopio Los Salias (demo)",
  slug: "centro-los-salias-demo",
  addressLabel: "San Antonio de los Altos, Miranda",
  lat: 10.3739,
  lng: -66.9769,
  contactName: "Coordinación municipal",
  contactPhone: "0212-000-0000",
  registrationStatus: "approved",
  createdAt: new Date().toISOString(),
  approvedAt: new Date().toISOString(),
});
passwordHashes.set(demoCentro.id, hashPassword("centro123"));

const centros: CentroAcopio[] = [demoCentro];

// Seed a spread of statuses across the four levels for the demo centro.
const productStatuses: ProductStatus[] = (() => {
  const levels: StockStatus[] = [
    "critico",
    "necesita_mas",
    "suficiente",
    "abundante",
  ];
  return products.slice(0, 40).map(
    (p, i) =>
      new ProductStatus({
        id: crypto.randomUUID(),
        centroId: demoCentro.id,
        productId: p.id,
        status: levels[i % levels.length],
        updatedAt: new Date(Date.now() - i * 60_000).toISOString(),
        updatedBy: "Centro admin",
      }),
  );
})();

const summaryFor = (centro: CentroAcopio): CentroSummary => {
  const rows = productStatuses.filter((s) => s.centroId === centro.id);
  return {
    centro,
    criticoCount: rows.filter((s) => s.status === "critico").length,
    necesitaMasCount: rows.filter((s) => s.status === "necesita_mas").length,
    trackedCount: rows.length,
    lastUpdated:
      rows.reduce<string | null>(
        (acc, s) => (!acc || s.updatedAt > acc ? s.updatedAt : acc),
        null,
      ) ?? null,
  };
};

const catalogImpl: CatalogRepositoryShape = {
  listCategories: () => Effect.succeed(categories),
  listProducts: () => Effect.succeed(products),
  createProduct: (request) =>
    Effect.sync(() => {
      const product = new Product({
        id: crypto.randomUUID(),
        categoryId: request.categoryId,
        name: request.name,
        sortOrder: products.length,
      });
      products.push(product);
      return product;
    }),
};

const centrosImpl: CentrosRepositoryShape = {
  listApproved: () =>
    Effect.sync(() =>
      centros.filter((c) => c.registrationStatus === "approved"),
    ),

  listApprovedSummaries: () =>
    Effect.sync(() =>
      centros
        .filter((c) => c.registrationStatus === "approved")
        .map(summaryFor),
    ),

  listAll: () => Effect.sync(() => [...centros]),

  getApprovedBySlug: (slug) =>
    Effect.suspend(() => {
      const centro = centros.find(
        (c) => c.slug === slug && c.registrationStatus === "approved",
      );
      return centro
        ? Effect.succeed(centro)
        : Effect.fail(new NotFoundError({ entity: "centro", id: slug }));
    }),

  register: (request) =>
    Effect.sync(() => {
      const centro = new CentroAcopio({
        id: crypto.randomUUID(),
        name: request.name,
        slug: `${slugify(request.name)}-${Math.random().toString(36).slice(2, 6)}`,
        addressLabel: request.addressLabel,
        lat: request.lat,
        lng: request.lng,
        contactName: request.contactName ?? null,
        contactPhone: request.contactPhone ?? null,
        registrationStatus: "pending",
        createdAt: new Date().toISOString(),
        approvedAt: null,
      });
      passwordHashes.set(centro.id, hashPassword(request.password));
      centros.unshift(centro);
      return centro;
    }),

  setRegistrationStatus: (id, status: RegistrationStatus) =>
    Effect.suspend(() => {
      const index = centros.findIndex((c) => c.id === id);
      if (index === -1)
        return Effect.fail(new NotFoundError({ entity: "centro", id }));
      const updated = new CentroAcopio({
        ...centros[index],
        registrationStatus: status,
        approvedAt:
          status === "approved" ? new Date().toISOString() : null,
      });
      centros[index] = updated;
      return Effect.succeed(updated);
    }),

  authenticate: (id, password) =>
    Effect.suspend(() => {
      const centro = centros.find((c) => c.id === id);
      const hash = passwordHashes.get(id);
      if (!centro || !hash)
        return Effect.fail(new AuthError({ message: "Centro o clave inválida." }));
      if (centro.registrationStatus !== "approved")
        return Effect.fail(
          new AuthError({ message: "Este centro aún no ha sido aprobado." }),
        );
      if (!verifyPassword(password, hash))
        return Effect.fail(new AuthError({ message: "Centro o clave inválida." }));
      return Effect.succeed(centro);
    }),
};

const productStatusImpl: ProductStatusRepositoryShape = {
  listByCentro: (centroId) =>
    Effect.sync(() => productStatuses.filter((s) => s.centroId === centroId)),

  upsert: (centroId, productId, status, updatedBy) =>
    Effect.sync(() => {
      const index = productStatuses.findIndex(
        (s) => s.centroId === centroId && s.productId === productId,
      );
      const row = new ProductStatus({
        id: index === -1 ? crypto.randomUUID() : productStatuses[index].id,
        centroId,
        productId,
        status,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy ?? null,
      });
      if (index === -1) productStatuses.push(row);
      else productStatuses[index] = row;
      return row;
    }),
};

export const CatalogRepositoryMock = Layer.succeed(
  CatalogRepository,
  catalogImpl,
);
export const CentrosRepositoryMock = Layer.succeed(
  CentrosRepository,
  centrosImpl,
);
export const ProductStatusRepositoryMock = Layer.succeed(
  ProductStatusRepository,
  productStatusImpl,
);
