# AlivioVenezuela

Real-time, no-login aid coordination for the June 24, 2026 earthquake doublet in
Yaracuy & Carabobo, Venezuela. Anyone can **report a need** and anyone can
**cover it**, with live visibility so duplicate effort is obvious before it
happens.

> UI is in Spanish (target users are in Venezuela). Code, comments and commits
> are in English.

## Features

- **Report a need** in under 30s: category, urgency, description, location (drop
  a pin or use device GPS), optional contact.
- **Browse** as a list (critical-first, then most recent) or a Leaflet map with
  urgency-colored pins. Filter by category and status — list and map stay in
  sync from the same data.
- **Cover a need**: `open → in_progress → covered`, no auth, large tap targets.
- **Live sync** across all devices via Supabase Realtime — no manual refresh.
- **Soft duplicate detection**: same-category needs within ~750 m raise a
  non-blocking warning ("flag, don't block").
- **Export**: copy/share a plain-text list of pending needs for NGOs offline.
- **Graceful fallback**: with no database configured, the app runs on an
  in-memory store (demo mode) so the deployed URL is never blank.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Effect** — the application is structured around Effect (services, layers,
  schema, typed errors). See [Architecture](#architecture-the-effect-layer).
- **Supabase** (Postgres + Realtime) — RLS read-only for the browser; writes go
  through the server with the service role key.
- **Leaflet** + OpenStreetMap tiles (no API key)
- **Tailwind CSS v4**, mobile-first
- **Vercel** for hosting

## Architecture (the Effect layer)

The codebase is organized as a functional core wired with Effect's dependency
injection, so the data layer is swappable and every failure is typed.

```
src/
  domain/        Pure domain. Effect `Schema` models (Need, StatusUpdate),
                 enums, and `Data.TaggedError` types (Validation/Database/...).
  services/      Effect services (`Context.Tag`) + `Layer` implementations:
                   Supabase            – server client (service role)
                   NeedsRepository     – CRUD, returns typed Effects
                   MockNeedsRepository – in-memory layer (same interface)
                   DuplicateDetector   – proximity check over the repository
  runtime/       `ManagedRuntime` assembled from the layers (live or mock,
                 chosen by whether Supabase env vars are present).
  lib/           http (Exit → Response mapping), api client, geo, formatting.
  app/api/       Route handlers that build an Effect program and run it.
  components/    Client UI (dashboard, list, map, report modal, badges).
```

Dependency flow: `Supabase → NeedsRepository → DuplicateDetector`. Layers are
memoized by reference, so a single Supabase client is shared per process. API
routes never touch the database directly — they describe an `Effect` and hand it
to the runtime, which maps the typed `Exit` to an HTTP status.

## Getting started (local)

```bash
npm install
cp .env.example .env.local   # optional: fill in Supabase creds for realtime
npm run dev                  # http://localhost:3000
```

Without Supabase credentials the app starts in **demo mode** (seeded in-memory
data, single-client). Add the env vars to enable Postgres + cross-device
realtime.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
   (creates enums, `needs` + `status_updates`, RLS read policies, the realtime
   publication, and demo seed rows).
3. Copy the project credentials into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The anon key is browser-safe (read + realtime only, enforced by RLS). The
service role key is server-only and used to write rows for unauthenticated
users.

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel (framework auto-detected).
2. Add the three env vars above in **Project → Settings → Environment
   Variables** (`SUPABASE_SERVICE_ROLE_KEY` must NOT be exposed publicly).
3. Deploy. The result is a public, shareable URL.

## Scripts

| Script              | Description                |
| ------------------- | -------------------------- |
| `npm run dev`       | Dev server                 |
| `npm run build`     | Production build           |
| `npm run start`     | Run the production build    |
| `npm run typecheck` | `tsc --noEmit`             |

## Acceptance criteria

- [x] Submit a need from a phone browser in < 30s
- [x] New need appears on other devices without refresh (Realtime)
- [x] Status changes reflected live across clients
- [x] Map + list stay in sync from the same data
- [x] One-handed mobile UX, large tap targets, no horizontal scroll
- [x] Slow/unstable connection: clear pending/error/success states
- [ ] Deployed to a public URL — requires Supabase + Vercel credentials (see above)
