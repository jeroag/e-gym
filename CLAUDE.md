# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

E-GYM: a trainer/client gym-management app. Express.js + raw `pg` REST API backend, Vue 3 + Pinia + Tailwind SPA frontend, Postgres database (Supabase, Neon, Railway, or local — any Postgres works; the backend talks to it directly via `DATABASE_URL`, not via Supabase's client SDK or RLS). Most UI strings, comments, and commit-style content in this repo are in **Spanish** — match that when editing existing files.

## Commands

There is no test suite, linter, or formatter configured in this repo (no `.eslintrc`, no test scripts). Don't invent commands for them.

From the repo root (pnpm workspace-style root runner, not a real pnpm workspace — each app has its own lockfile):
```
pnpm install:all     # installs root + backend + frontend deps
pnpm dev             # runs backend and frontend concurrently
pnpm dev:back        # backend only  → http://localhost:3000
pnpm dev:front       # frontend only → http://localhost:5173
```

Backend (`backend/`, ESM "type": "module"):
```
pnpm dev             # node --watch src/index.js
pnpm start           # node src/index.js (no watch)
```

Frontend (`frontend/`):
```
pnpm dev             # vite dev server (proxies /api → http://localhost:3000)
pnpm build           # vite build (deployed via railway.json, staticDir: dist)
pnpm preview         # preview the production build
```

### Local setup
1. Provision a Postgres DB and run `supabase/schema.sql` against it (then optionally `supabase/seed.sql`).
2. Copy `backend/.env.example` → `backend/.env` and fill `DATABASE_URL`, `JWT_SECRET`, `TRAINER_LICENSE_CODE` (set the latter to enable trainer registration; leave empty to disable it).
3. Copy `frontend/.env.example` → `frontend/.env` (`VITE_API_URL`, defaults to `http://localhost:3000/api`).

## Architecture

### Backend (`backend/src`)
Plain Express app, single Postgres `pg.Pool` (`db.js`) shared across the app — no ORM, hand-written SQL with parameterized queries everywhere.

- `index.js` — app wiring: helmet, CORS allowlist (`FRONTEND_URL` + localhost dev ports), JSON body parsing, route mounting under `/api/*`, a global error-handling middleware (reads `err.status`/`err.statusCode`, masks 5xx messages), and a `setInterval` that purges expired revoked tokens every 6h.
- `routes/*.js` — one router per resource (`auth`, `users`, `workouts`, `exercises`, `progress`, `messages`, `sessions`, `schedule`). Every async handler is wrapped in `asyncHandler` (`utils/asyncHandler.js`) so thrown errors reach the global error handler instead of needing try/catch per route.
- `middleware/auth.js` — `requireAuth` verifies the app's own HS256 JWT (signed with `JWT_SECRET`, **not** Supabase Auth), loads the user from `users` by `decoded.sub`, and attaches it as `req.user`. `requireRole(...roles)` gates routes by `req.user.role` (`'trainer' | 'client'`).
- `middleware/rate-limit.js` — per-route limiters (`loginLimiter`, `registerLimiter`, `forgotPasswordLimiter`, `messageLimiter`) built on `express-rate-limit`.
- `utils/db-helpers.js` — shared query helpers: `isMyClient(trainerId, clientId)` (the standard ownership check used before a trainer can read/write a client's data), `addRevokedToken`/`isTokenRevoked`/`purgeExpiredTokens` (refresh-token blacklist for logout/rotation).
- `supabase.js` — exports `supabaseAdmin`/`supabase` clients from `@supabase/supabase-js`, but **`@supabase/supabase-js` is not in `package.json` and the file is not imported anywhere**. Treat it as legacy/unused; the app talks to Postgres directly through `pool`.

Auth model: custom JWT (not Supabase Auth) — short-lived access tokens (15m) + rotating refresh tokens (30d) with a server-side revocation blacklist (`revoked_tokens` table, keyed by JWT `jti`). Refresh tokens are revoked-and-reissued on every `/auth/refresh` call (rotation). Passwords hashed with bcrypt.

### Database (`supabase/`)
`schema.sql` is the source of truth for the schema and is meant to be run by hand against any Postgres instance (no migration tool). **It is currently incomplete**: the route code references `workout_sessions` and `workout_schedule` tables (used by `routes/sessions.js` and `routes/schedule.js`) that do not appear in `schema.sql`'s `CREATE TABLE` statements — check the live DB / `seed.sql` rather than assuming `schema.sql` is exhaustive, and update it if you add or change tables.

Core tables: `users` (role enum `trainer`/`client`, self-referencing `trainer_id`), `exercises` (catalog; `trainer_id IS NULL` = global/shared, otherwise private to a trainer), `workouts` (header; `trainer_id IS NULL` = client self-created), `workout_exercises` (routine line items), `progress_logs` (per-set logs, with a unique daily-upsert index on client+exercise+set+day), `body_metrics`, `messages`, `revoked_tokens`.

Ownership model that recurs everywhere: a trainer can only act on a client whose `users.trainer_id` points to them — always checked via `isMyClient()` before trainer routes touch client-scoped data (workouts, progress, sessions, schedule).

### Frontend (`frontend/src`)
Vue 3 (Composition API, `<script setup>` style) + Pinia + Vue Router + Tailwind, built with Vite (dev server proxies `/api` to `localhost:3000`).

- `router/index.js` — route table split by role (`meta: { role: 'trainer' | 'client' }`) and visibility (`meta: { public: true }`). The global `beforeEach` guard dynamically imports the auth store (to dodge a store↔router import cycle), awaits `auth.bootstrap()` so route decisions never race session restoration, then redirects based on login state and role mismatch.
- `stores/auth.js` — Pinia store holding `user`/`token`, persisted to `localStorage` (`access_token`, `refresh_token`, `user`). `bootstrap()` validates the stored token against `/users/me` on startup; it's idempotent and memoizes its in-flight promise (`_bootstrapPromise`) so concurrent callers (router guard + app init) don't double-fire. `login`/`register`/`logout` drive both the API and the router.
- `api/axios.js` — single axios instance (`baseURL = VITE_API_URL`). Request interceptor attaches the bearer token; response interceptor implements **silent token refresh on 401** (one retry via `_retry` flag, calls `/auth/refresh`, replays the original request) and falls back to clearing the session + redirecting to `/login` on refresh failure — using a dynamic import of the Pinia store/router to avoid circular-import issues at module-load time.
- `views/` — organized by audience: `auth/` (login/register/forgot-password, public), `trainer/` (dashboard, clients, client detail, workouts, exercises), `client/` (dashboard, progress, messages, settings), `shared/` (e.g. `MessagesView` reused by both roles via router `props`).
- `composables/` — encapsulate cross-cutting client behavior: `useOfflineQueue` (queues failed `/progress/log` POSTs in `localStorage` under `egym_offline_queue` and flushes them on the `online` event — used so set-logging works without connectivity), `useRestTimer`/`useWorkoutTimer` (in-session timers), `useNotifications`, `usePwaInstall`, `useToast`, `useCountUp`.
- `components/common/` — shared UI primitives and feature widgets (modals/sheets like `WorkoutFormModal`, `AddExerciseSheet`, `ScheduleSheet`, `PlateCalculatorSheet`, `RestTimerOverlay`, plus layout (`AppLayout`, `AuthLayout`), `Toaster`, `Skeleton`, etc).

### Cross-cutting conventions
- All authenticated routes go through `requireAuth` (and usually `requireRole`); trainer routes that touch a specific client must call `isMyClient` first and return 403 if it fails.
- Backend responses are plain JSON `{ error: '...' }` on failure (Spanish messages) / resource objects on success; `asyncHandler` + the global error middleware are the only error-flow mechanism — don't add per-route try/catch for things that should just throw.
- Frontend never talks to the API without going through the shared `api` axios instance (token attachment + refresh handling depend on it).
