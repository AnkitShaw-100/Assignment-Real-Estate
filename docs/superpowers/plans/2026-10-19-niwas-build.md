# Niwas Build — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Niwas real estate website + CRM described in `docs/PRD.md`, styled per `docs/DESIGN.md`, deployed on Vercel.

**Architecture:** Monorepo with `server/` (Express 5 + Mongoose, exported as a Vercel serverless function, Mongo connection cached on `globalThis`) and `client/` (Vite + React 19 SPA with a public website and a role-gated `/dashboard`). Clerk authenticates; our middleware syncs the Clerk user into Mongo and enforces role + ownership scoping.

**Tech Stack:** Node 22, Express 5, Mongoose 8, Zod, @clerk/express, Cloudinary, Vitest + Supertest + mongodb-memory-server · React 19, Vite, Tailwind v4, motion (Framer Motion), React Router 7, TanStack Query 5, react-hook-form, Recharts, @dnd-kit, @clerk/clerk-react, lucide-react, sonner.

**Spec:** `docs/PRD.md`, `docs/DESIGN.md`, `docs/reference/homepage-mockup.webp`

## Global Constraints

- Language: JavaScript (ESM, `"type": "module"`) on both sides. No TypeScript.
- Every API error: `{ "error": { "message": string, "details"?: object } }`. Lists: `{ data, page, limit, total }`.
- Roles: exactly `buyer | agent | admin`. Lead stages: exactly `new | contacted | qualified | site_visit | negotiation | won | lost`.
- Agents only ever see records where they are `assignedTo` / `assignedAgent` / `assignee` / `agent`.
- Copy: sentence case, no all-caps labels, buttons named by the action ("Send inquiry"), toasts echo the verb.
- Motion: transform/opacity only; respect `prefers-reduced-motion`.
- Brass `#E8AD47` only on actionable elements and prices.
- Commit after every task with a conventional-commit message ending in the `Co-Authored-By` trailer.

## File map

```
server/
  api/index.js                 Vercel entry: exports the app
  vercel.json                  rewrite all → /api
  src/app.js                   createApp({ resolveAuth }) — middleware + routes
  src/server.js                local dev: connect + listen
  src/config/env.js            zod-validated process.env
  src/config/db.js             connectDB() cached on globalThis
  src/middleware/auth.js       attachUser(resolveAuth), requireAuth, requireRole(...roles)
  src/middleware/validate.js   validate({ body, query, params })
  src/middleware/sanitize.js   strips $/. keys from body & params
  src/middleware/error.js      notFound, errorHandler
  src/utils/httpError.js       HttpError(status, message, details)
  src/utils/scope.js           scopeFilter(user, field) → Mongo filter
  src/utils/paginate.js        parsePage(query) / pageResult(...)
  src/models/*.js              User, Property, Lead, Customer, Task
  src/modules/<name>/<name>.routes.js | .controller.js | .schema.js | .service.js
     properties, leads, customers, tasks, users, dashboard, uploads, stats
  src/scripts/seed.js
  tests/helpers.js             in-memory mongo + test app with header-based auth
  tests/*.test.js
client/
  src/main.jsx, App.jsx (router), index.css (Tailwind @theme tokens)
  src/lib/        api.js, format.js, motion.js, constants.js
  src/hooks/      useProperties.js, useLeads.js, ... (TanStack Query)
  src/components/ui/     Button, Field, Select, Badge, Skeleton, Drawer, Modal, EmptyState
  src/components/site/   Navbar, Footer, SearchPill, ExploreBadge, Carousel, PropertyCard, ...
  src/components/crm/    Sidebar, Topbar, KpiCard, LeadDrawer, Kanban, ...
  src/pages/site/        Home, Properties, PropertyDetail, About, Contact, Saved, MyInquiries, NotFound
  src/pages/crm/         Overview, Leads, Pipeline, Customers, CustomerDetail, Tasks, PropertiesAdmin, PropertyForm, Team
  src/routes/            RequireRole.jsx, layouts
```

---

## Phase 1 — Backend

### Task 1: Server scaffold, env, DB, error contract
**Files:** `server/package.json`, `src/app.js`, `src/server.js`, `src/config/{env,db}.js`, `src/middleware/{error,sanitize}.js`, `src/utils/httpError.js`, `api/index.js`, `vercel.json`, `.env.example`, `tests/helpers.js`, `tests/app.test.js`
**Produces:** `createApp({ resolveAuth? }) → express.Application`; `connectDB() → Promise<Mongoose>`; `HttpError`.
- [ ] Test: `GET /api/health` → 200 `{ ok: true }`; unknown route → 404 `{ error: { message: "Route not found" } }`; body `{ "$where": 1 }` reaches handlers without the `$` key.
- [ ] Implement; helmet, cors(allowlist), json limit 1mb, rate-limit 300/15min, sanitize, routes, notFound, errorHandler (maps ZodError→400, CastError→400, duplicate key→409).
- [ ] `npm test` green → commit `chore(server): scaffold express app with error contract`.

### Task 2: Models
**Files:** `src/models/{User,Property,Lead,Customer,Task}.js`, `tests/models.test.js`
**Produces:** Mongoose models exactly as PRD §5; `LEAD_STAGES`, `PROPERTY_TYPES`, `ROLES` exported from `src/models/enums.js`; Property pre-validate hook creates a unique slug from title + short id.
- [ ] Test: slug generated; invalid stage rejected; required fields enforced.
- [ ] Implement → green → commit `feat(server): add domain models`.

### Task 3: Auth + RBAC
**Files:** `src/middleware/auth.js`, `src/utils/scope.js`, `tests/auth.test.js`
**Interfaces:** `resolveAuth(req) → { clerkId } | null` (default: `getAuth(req).userId` from `@clerk/express`; tests: `x-test-clerk-id` header). `attachUser` sets `req.user` (Mongo doc), creating it on first sight via `clerkClient.users.getUser` (tests: a `fetchProfile` stub) with role `admin` if email ∈ `ADMIN_EMAILS` else `buyer`. `requireAuth` → 401; `requireRole(...roles)` → 403. `scopeFilter(user, field)` → `{}` for admin, `{ [field]: user._id }` otherwise.
- [ ] Tests: no auth → 401; buyer on agent route → 403; first request creates user; admin email → admin.
- [ ] Implement → green → commit `feat(server): clerk auth with mongo user sync and role guards`.

### Task 4: Properties API + uploads signature
**Files:** `src/modules/properties/*`, `src/modules/uploads/*`, `tests/properties.test.js`
Endpoints per PRD §4. Public list only returns `status ∈ {available, under_offer}` unless `?mine` from staff. Filters: q (regex on title/city/area), city, category, type, purpose, minPrice, maxPrice, beds (`5` means ≥5), featured, sort (`newest|price_asc|price_desc`), page, limit ≤ 48. Agent can only PATCH/DELETE own; admin any. DELETE also calls `cloudinary.uploader.destroy` per image (skipped if not configured).
- [ ] Tests: filters combine; agent cannot edit another agent's property (403); validation error → 400 with details.
- [ ] Implement → green → commit `feat(server): properties CRUD, search filters and signed uploads`.

### Task 5: Leads + pipeline
**Files:** `src/modules/leads/*`, `tests/leads.test.js`
`POST /leads/inquiry` (rate-limited 5/10min/IP) → assigns active agent with fewest open leads; property's agent preferred if property given. `PATCH /:id/stage { stage, dealValue?, lostReason? }`: appends activity; `won` requires dealValue, upserts Customer by email, pushes deal, sets property status sold/rented; `lost` requires lostReason. Setting `followUpDate` creates a Task for the assignee. `GET /leads/mine` (any signed-in user) returns leads whose email matches `req.user.email`, populated with property title/slug/cover.
- [ ] Tests: inquiry auto-assigns; agent sees only own leads; won creates customer + marks property sold; lost without reason → 400.
- [ ] Implement → green → commit `feat(server): leads, inquiry intake and pipeline transitions`.

### Task 6: Customers, tasks, users, dashboard, public stats
**Files:** `src/modules/{customers,tasks,users,dashboard,stats}/*`, `tests/{customers,tasks,dashboard}.test.js`
Customer interactions append; `/matches` filters available properties by budget/locations/types/bedrooms. Tasks `?due=overdue|today|upcoming`. Users: `me`, saved toggle, admin list + role change (mirrors to Clerk `publicMetadata.role`, stubbable). Dashboard overview: KPIs, 12-month sales series, leads by source, funnel counts — all scoped.
- [ ] Tests for scoping, task buckets, overview shape.
- [ ] Implement → green → commit per module group.

### Task 7: Seed script
**Files:** `src/scripts/seed.js`, `src/scripts/data/*.js`
Creates users by email (clerkId `seed_<n>` until they sign in; `attachUser` relinks by email on first login), 24 properties with Unsplash URLs, ~40 leads over 6 months across stages, customers, tasks. `npm run seed` is idempotent (wipes seed collections).
- [ ] Run against Atlas/local → verify counts in Compass → commit `feat(server): seed data`.

## Phase 2 — Website

### Task 8: Client scaffold + design tokens + UI primitives
Vite React app, Tailwind v4 `@theme` with DESIGN.md tokens, fonts, ClerkProvider, QueryClient, router, `api.js` (axios, attaches Clerk token), `motion.js` (easings/springs), UI primitives. Verify: `npm run build` passes; tokens render on a scratch route. Commit.

### Task 9: Site layout — glass Navbar, Footer, ExploreBadge
Verify against the mockup at 1440 / 768 / 375. Commit.

### Task 10: Home page — all 9 mockup sections, hero load sequence, carousels, count-up stats
Data from `/properties?featured`, `/stats/public`. Verify visually vs mockup + reduced-motion. Commit.

### Task 11: Listings page — URL-synced filters, grid, pagination, mobile filter sheet
Commit.

### Task 12: Property detail — shared-element image, gallery/lightbox, facts, amenities, agent card, inquiry form (RHF + Zod), similar, save
Commit.

### Task 13: About, Contact, Saved, My inquiries, 404
Commit.

## Phase 3 — CRM

### Task 14: Dashboard shell + RequireRole + Overview (KPIs, Recharts, today panel)
### Task 15: Leads table + filters + LeadDrawer (edit, notes, follow-up, convert)
### Task 16: Pipeline kanban (dnd-kit, optimistic, won/lost dialogs)
### Task 17: Customers list + profile (requirements, interactions timeline, matches)
### Task 18: Tasks board (buckets, quick add, complete)
### Task 19: Properties admin + PropertyForm with Cloudinary drag-drop upload
### Task 20: Team page (admin)
Each: build → verify in browser at desktop + mobile → commit.

## Phase 4 — Ship

### Task 21: Polish pass — a11y (focus, labels, keyboard), responsive sweep, Lighthouse
### Task 22: Deploy — two Vercel projects, env vars, Atlas network access, Clerk allowed origins; smoke test live
### Task 23: README.md + docs/ARCHITECTURE.md (diagram, data flow, decisions) → final commit, push
