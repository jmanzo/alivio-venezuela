import { Effect, Layer } from "effect";
import { NeedNotFoundError } from "@/domain/errors";
import type { Category, NeedStatus, Urgency } from "@/domain/Need";
import { Need } from "@/domain/Need";
import { NeedsRepository, type NeedsRepositoryShape } from "./NeedsRepository";

type SeedRow = {
  category: Category;
  description: string;
  urgency: Urgency;
  lat: number;
  lng: number;
  locationLabel: string;
  status: NeedStatus;
  reporterContact: string | null;
  createdAt: string;
};

/**
 * In-memory repository used when Supabase credentials are absent. It keeps the
 * app fully usable (report / cover / list) for local demos and as a graceful
 * fallback on the deployed URL before the database is wired. It has the SAME
 * interface as the live repository, so nothing else in the app changes.
 *
 * Note: realtime cross-client sync is unavailable in this mode (no Supabase
 * channel); the UI degrades to single-client optimistic updates.
 */

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const seed = (): Need[] =>
  ([
    {
      category: "water",
      description: "Familias sin agua potable desde el terremoto.",
      urgency: "critical",
      lat: 10.34,
      lng: -68.74,
      locationLabel: "San Felipe, Yaracuy",
      status: "open",
      reporterContact: "Comité vecinal",
      createdAt: minutesAgo(12),
    },
    {
      category: "medicine",
      description: "Se necesitan insulina y analgésicos.",
      urgency: "critical",
      lat: 10.162,
      lng: -68.0077,
      locationLabel: "Valencia centro, Carabobo",
      status: "open",
      reporterContact: null,
      createdAt: minutesAgo(34),
    },
    {
      category: "shelter",
      description: "Refugio temporal para 12 personas.",
      urgency: "high",
      lat: 10.235,
      lng: -68.73,
      locationLabel: "Cocorote, Yaracuy",
      status: "in_progress",
      reporterContact: "Cruz local",
      createdAt: minutesAgo(70),
    },
    {
      category: "food",
      description: "Comida para albergue infantil.",
      urgency: "high",
      lat: 10.178,
      lng: -67.99,
      locationLabel: "Naguanagua, Carabobo",
      status: "open",
      reporterContact: null,
      createdAt: minutesAgo(95),
    },
    {
      category: "water",
      description: "Cisterna requerida para sector alto.",
      urgency: "medium",
      lat: 10.07,
      lng: -68.005,
      locationLabel: "Los Guayos, Carabobo",
      status: "open",
      reporterContact: null,
      createdAt: minutesAgo(140),
    },
    {
      category: "other",
      description: "Pañales y artículos de higiene.",
      urgency: "medium",
      lat: 10.33,
      lng: -68.755,
      locationLabel: "Independencia, Yaracuy",
      status: "covered",
      reporterContact: "Donante anónimo",
      createdAt: minutesAgo(220),
    },
  ] satisfies SeedRow[]).map((n) => new Need({ id: crypto.randomUUID(), ...n }));

// Module-level store: a per-process singleton (good enough for a fallback).
const store: Need[] = seed();

const URGENCY_RANK = { critical: 0, high: 1, medium: 2 } as const;

const sorted = (rows: Need[]) =>
  [...rows].sort(
    (a, b) =>
      URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] ||
      b.createdAt.localeCompare(a.createdAt),
  );

const impl: NeedsRepositoryShape = {
  list: (filters) =>
    Effect.sync(() =>
      sorted(
        store.filter(
          (n) =>
            (!filters?.category || n.category === filters.category) &&
            (!filters?.status || n.status === filters.status),
        ),
      ),
    ),

  listActiveByCategory: (category) =>
    Effect.sync(() =>
      store.filter(
        (n) =>
          n.category === category &&
          (n.status === "open" || n.status === "in_progress"),
      ),
    ),

  create: (request) =>
    Effect.sync(() => {
      const need = new Need({
        id: crypto.randomUUID(),
        category: request.category,
        description: request.description,
        urgency: request.urgency,
        lat: request.lat,
        lng: request.lng,
        locationLabel: request.locationLabel,
        status: "open",
        reporterContact: request.reporterContact ?? null,
        createdAt: new Date().toISOString(),
      });
      store.unshift(need);
      return need;
    }),

  updateStatus: (id, status) =>
    Effect.suspend(() => {
      const index = store.findIndex((n) => n.id === id);
      if (index === -1) return Effect.fail(new NeedNotFoundError({ id }));
      const updated = new Need({ ...store[index], status });
      store[index] = updated;
      return Effect.succeed(updated);
    }),
};

export const NeedsRepositoryMock = Layer.succeed(NeedsRepository, impl);
