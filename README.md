# AlivioVenezuela

A lightweight, real-time **semaphore of collection centers** ("centros de
acopio") for the June 24, 2026 earthquake in Venezuela. Citizens see, at a
glance, **what to bring — and what NOT to bring** to each center before they
donate; each center keeps its own board up to date; an operator approves new
centers before they go public.

> UI is in Spanish (target users are in Venezuela). Code, comments and commits
> are in English.

## What it does

- **Público (no login):** browse approved centers on a list or map, open any
  center to see its live product semaphore, and register a new center.
- **Centro admin (password per center):** once approved, log in and set the
  stock status of each product. Changes appear to the public in near-real-time.
- **Super admin (single password):** approve / reject / disable centers.

### The semaphore

Each product a center tracks has one of four stock levels:

| Estado         | Significado                                                    |
| -------------- | ------------------------------------------------------------- |
| 🚨 Crítico     | Sin stock. Traer con prioridad.                               |
| ⚠️ Necesita más | Quedan pocas unidades.                                        |
| ✅ Suficiente   | Inventario adecuado por ahora.                               |
| 📦 Abundante   | No traer — bien abastecidos.                                  |

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Effect** — services, layers, schema, typed errors (the data layer is
  swappable and every failure is typed).
- **Supabase** (Postgres + Realtime) — anon key is realtime-only under RLS;
  writes go through the server with the service-role key after an auth check.
- **Leaflet** + OpenStreetMap tiles (no API key) — pin per center.
- **Tailwind CSS v4**, mobile-first. Custom CSS uses the BEM pattern.
- **Vercel** for hosting.

## Architecture

```
src/
  domain/        Pure domain. Effect `Schema` models (Catalog, Centro,
                 ProductStatus), enums, and `Data.TaggedError` types.
  services/      Effect services (`Context.Tag`) + `Layer` implementations:
                   Supabase                – server client (service role)
                   CatalogRepository       – categories + products
                   CentrosRepository       – register / approve / authenticate
                   ProductStatusRepository – per-centro stock statuses
                   MockRepositories        – in-memory layers (demo mode)
  runtime/       `ManagedRuntime` assembled from the layers (live or mock,
                 chosen by whether Supabase env vars are present).
  lib/           auth (password hashing + signed session cookie), http
                 (Exit -> Response), api client, present/view mappers, format.
  app/           Pages (home, centros/[slug], registrar, centro, admin) and
                 API route handlers.
  components/    Client UI (browser, semaphore board, admin panels, forms).
```

Auth is intentionally lightweight: no user accounts. Writers are gated by a
password (one per centro, one super-admin password) plus a signed, httpOnly
session cookie. The public experience needs no login at all.

## Getting started (local)

```bash
npm install
npm run dev                  # http://localhost:3000
```

Without Supabase credentials the app runs in **demo mode** (seeded in-memory
data, single-client, no realtime). A demo centro is available with password
`centro123`, and the super-admin password defaults to `admin`.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
   (drops any v1 tables, creates the enums, `categories` / `products` /
   `centros_acopio` / `product_status`, RLS policies, the realtime publication,
   and seeds the catalog + one approved demo centro).
3. Set the environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPER_ADMIN_PASSWORD=choose-a-strong-password
SESSION_SECRET=choose-a-long-random-string
```

The anon key is browser-safe: RLS grants it realtime/read only on the public
`product_status` table, and it has NO read access to `centros_acopio`, so the
admin password hashes can never reach the browser. The service role key is
server-only.

## Roles & URLs

| URL                | Who            | What                                        |
| ------------------ | -------------- | ------------------------------------------- |
| `/`                | Público        | Browse centers (list + map)                 |
| `/centros/[slug]`  | Público        | A center's live semaphore board             |
| `/registrar`       | Público        | Register a new center (pending approval)    |
| `/centro`          | Centro admin   | Log in, edit product statuses               |
| `/admin`           | Super admin    | Approve / reject / disable centers          |

## Scripts

| Script              | Description       |
| ------------------- | ----------------- |
| `npm run dev`       | Dev server        |
| `npm run build`     | Production build   |
| `npm run start`     | Run the build     |
| `npm run typecheck` | `tsc --noEmit`    |

## Deploy to Vercel

1. Push to GitHub and import in Vercel (framework auto-detected).
2. Add the five env vars above (`SUPABASE_SERVICE_ROLE_KEY`, `SUPER_ADMIN_PASSWORD`
   and `SESSION_SECRET` must NOT be exposed publicly).
3. Deploy for a public, shareable URL.
