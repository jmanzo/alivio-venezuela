import type { Category, Product } from "@/domain/Catalog";
import type {
  CentroAcopio,
  CentroSummary,
  ProductStatus,
} from "@/domain/Centro";
import type {
  CategoryView,
  CentroSummaryView,
  CentroView,
  ProductStatusView,
  ProductView,
} from "./view";

/**
 * Maps Effect `Schema.Class` domain instances to plain, serializable view
 * objects so they can safely cross the Server -> Client Component boundary.
 */

export const toCentroView = (c: CentroAcopio): CentroView => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  addressLabel: c.addressLabel,
  lat: c.lat,
  lng: c.lng,
  contactName: c.contactName,
  contactPhone: c.contactPhone,
  registrationStatus: c.registrationStatus,
  createdAt: c.createdAt,
  approvedAt: c.approvedAt,
});

export const toSummaryView = (s: CentroSummary): CentroSummaryView => ({
  centro: toCentroView(s.centro),
  criticoCount: s.criticoCount,
  necesitaMasCount: s.necesitaMasCount,
  trackedCount: s.trackedCount,
  lastUpdated: s.lastUpdated,
});

export const toCategoryView = (c: Category): CategoryView => ({
  id: c.id,
  name: c.name,
  sortOrder: c.sortOrder,
});

export const toProductView = (p: Product): ProductView => ({
  id: p.id,
  categoryId: p.categoryId,
  name: p.name,
  sortOrder: p.sortOrder,
});

export const toProductStatusView = (s: ProductStatus): ProductStatusView => ({
  productId: s.productId,
  status: s.status,
  updatedAt: s.updatedAt,
});
