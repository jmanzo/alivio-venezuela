import type { RegistrationStatus, StockStatus } from "@/domain/Centro";

/**
 * Plain, serializable view types passed from Server Components to Client
 * Components. Domain objects are Effect `Schema.Class` instances (not plain
 * objects), so pages map them to these shapes before crossing the boundary.
 */

export interface CentroView {
  id: string;
  name: string;
  slug: string;
  addressLabel: string;
  lat: number;
  lng: number;
  contactName: string | null;
  contactPhone: string | null;
  registrationStatus: RegistrationStatus;
  createdAt: string;
  approvedAt: string | null;
}

export interface CentroSummaryView {
  centro: CentroView;
  criticoCount: number;
  necesitaMasCount: number;
  trackedCount: number;
  lastUpdated: string | null;
}

export interface CategoryView {
  id: string;
  name: string;
  sortOrder: number;
}

export interface ProductView {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
}

export interface ProductStatusView {
  productId: string;
  status: StockStatus;
  updatedAt: string;
}
