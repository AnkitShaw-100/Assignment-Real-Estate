# Architecture

## Overview

```
            ┌──────────────────────── Browser ────────────────────────┐
            │  React SPA (Vite)                                       │
            │   ├─ Website  /, /properties, /properties/:slug, …      │
            │   └─ CRM      /dashboard/* (lazy-loaded, role-gated)    │
            │  TanStack Query cache · AuthContext (wraps Clerk)       │
            └───────┬──────────────────────┬──────────────────┬───────┘
     Clerk session  │   REST/JSON + Bearer │   signed upload  │
         (sign-in)  ▼                      ▼                  ▼
            ┌──────────────┐   ┌───────────────────────┐   ┌────────────┐
            │    Clerk     │   │ Express 5 API         │   │ Cloudinary │
            │ identity     │◀──│ (Vercel function)     │──▶│ images     │
            └──────────────┘   │ auth → roles → Zod →  │   └────────────┘
                verify token,  │ controller/service    │
                read profile   └──────────┬────────────┘
                                          ▼
                                 ┌─────────────────┐
                                 │ MongoDB Atlas   │
                                 │ (Mongoose)      │
                                 └─────────────────┘
```

Two deployables in one repository: `frontend/` (static SPA) and `backend/` (Express app exported as a Vercel serverless function). They share no code. Enum values are mirrored in `backend/src/models/enums.js` and `frontend/src/lib/constants.js`.

## Request lifecycle (API)

Every request passes through the same chain in `backend/src/app.js`:

1. **helmet**: security headers.
2. **CORS allowlist**: only origins in `CLIENT_URL`.
3. **JSON body**: limited to 1 MB; malformed JSON becomes a 400.
4. **sanitize**: strips `$`- and `.`-prefixed keys to block NoSQL operator injection. (`express-mongo-sanitize` doesn't support Express 5.)
5. **rate limit**: 300 requests per 15 minutes per IP on the API, and 5 per 10 minutes on the public inquiry form, which also has a honeypot field.
6. **connectDB**: the connection promise is cached on `globalThis`, so a warm serverless instance reuses one pool instead of reconnecting per request.
7. **Clerk middleware**: verifies the session token. `authorizedParties` limits tokens to our own frontend origins.
8. **attachUser**: loads our MongoDB user for that Clerk id (see below).
9. **route guards**: `requireAuth`, `requireStaff`, `requireAdmin`.
10. **validate(Zod)**: parses params, query and body. Unknown keys are dropped, which prevents mass assignment (for example, sending `role: "admin"` to `/users/me` does nothing).
11. **controller / service**.
12. **errorHandler**: every error leaves as `{ error: { message, details? } }` with the right status. Zod and Mongoose validation errors become 400 with per-field messages, duplicate keys become 409, and unknown errors become 500 without leaking internals.

## Authentication vs authorization

- **Clerk** answers *who is this?* It handles sign-up, sign-in, sessions and email verification.
- **Our API** answers *what can they do?* The role (`buyer | agent | admin`) is stored on our own `User` document and enforced server-side.

**User sync without webhooks.** On the first authenticated request, `attachUser` looks up the user by Clerk id. If none exists, it fetches the profile from Clerk and either relinks a seeded user with the same email or creates a new one. New users are `buyer`, or `admin` if their email is in `ADMIN_EMAILS`. Webhooks would need a public URL, raw-body signature checks and retry handling, which are fragile on serverless and in local dev. Lazy sync is always consistent and has no moving parts. When an admin changes a role, it is also mirrored to Clerk `publicMetadata` (best effort; our database stays the source of truth).

**Row-level scoping.** `scopeFilter(user, field)` returns `{}` for admins and `{ [field]: user._id }` for agents. It is applied to every list query (leads by `assignedTo`, customers by `assignedAgent`, tasks by `assignee`, listings by `agent`). `assertInScope` returns **404 rather than 403** for other agents' records, so IDs can't be probed. Dashboard aggregates use the same scope, so an agent's KPIs are their own.

**Identity is injectable.** `createApp({ auth })` takes a small provider interface (`resolveAuth`, `fetchProfile`, `setRole`). Production uses Clerk. Tests use a header-based fake, and local development can use a bypass that is refused in production. The rest of the app never imports Clerk directly.

## Core business flows

**Website inquiry → lead**
`POST /leads/inquiry` validates the form, checks that the property is still public, and assigns an agent: the listing's own agent if active, otherwise the active agent with the fewest open leads, otherwise an admin. It stores a `created` activity entry. The visitor gets only `{ id, status: "received" }`; internal assignment data never leaves the API.

**Pipeline move** (`PATCH /leads/:id/stage`, in `leads.service.js#changeStage`)
- Every move appends to the lead's activity log.
- **Won** requires `dealValue`. It upserts the Customer by email, records the deal, and marks the property `sold` or `rented`.
- **Lost** requires `lostReason`.
- **Re-opening** a won lead reverses the side effects: the deal is removed and the property goes back to `under_offer`.
- After every change, `syncFollowUpTask` keeps exactly one open follow-up task in line with the lead's `followUpDate`, and removes it when the lead closes.

**Image upload**
The browser asks `POST /uploads/signature` (staff only) for a short-lived Cloudinary signature, then uploads the file **directly** to Cloudinary. Files never pass through our function, which matters because Vercel caps request bodies at 4.5 MB. The secret stays on the server. Deleting a listing, or removing photos while editing it, also deletes them from Cloudinary.

## Frontend structure

- **Routing**: one `createBrowserRouter` tree. The home page is in the main bundle; other website pages and the entire CRM are `lazy()`-loaded, so Recharts (about 370 kB) and dnd-kit never reach a visitor who only browses.
- **Server state**: TanStack Query. Hooks live in `hooks/usePublic.js` and `hooks/useCrm.js`. Query keys are grouped by resource, so a mutation refreshes everything related with one `invalidateQueries`. Pipeline moves, task completion and saving a home are **optimistic**, with rollback and an error toast if the API rejects them.
- **URL as state**: listing filters, CRM filters, the open lead drawer (`?open=<id>`) and the "Add lead" modal (`?new=1`) all live in the query string, so views are linkable and the back button behaves.
- **Forms**: React Hook Form + Zod, mirroring the API rules so most errors show instantly. Server field errors (`error.details`) are mapped back onto the matching inputs.
- **AuthContext**: the only place that touches Clerk. Components ask `useSession()` for `{ isSignedIn, me, role, isStaff, isAdmin }`. Route guards are a UX convenience; the API is the real gate.
- **Design system**: tokens in `index.css` (`@theme`) and motion tokens in `lib/motion.js`, both from [DESIGN.md](DESIGN.md). Primitives live in `components/ui/`.

## Data model

```
User ──< Property (agent)
User ──< Lead (assignedTo) >── Property
Lead >── Customer ──< deals { property, lead, value, closedAt }
                  └─< interactions { kind, summary, at, by }
User ──< Task (assignee) >── Lead / Customer
```

Indexes cover the hot paths: listing search (`status, category, type, purpose, price`, `location.city`), agent work queues (`assignedTo, status`, `assignee, status, dueAt`) and follow-up lookups (`followUpDate`).

## Key decisions

| Decision | Why | Trade-off |
|---|---|---|
| Express on Vercel serverless, connection cached on `globalThis` | One hosting platform for both apps, free tier, no server to manage | Cold starts on the first request after idle |
| Clerk for identity, our own RBAC | Production-grade sign-in without building password resets; roles and scoping stay in our code and are fully tested | An external dependency for sign-in |
| Lazy user sync instead of Clerk webhooks | No public webhook URL or signature handling; works identically locally and deployed | First request after sign-up does one extra Clerk API call |
| 404 instead of 403 for out-of-scope records | Doesn't reveal that another agent's record exists | Slightly less explicit for debugging |
| Signed direct-to-Cloudinary uploads | Bypasses Vercel's 4.5 MB body limit and keeps the secret server-side | Two round trips per upload |
| Zod on both client and server | Same rules everywhere; unknown keys stripped server-side | Schemas are duplicated (no shared package, to keep two independent deployables) |
| URL as UI state | Shareable filtered views, working back button | Slightly more code than local state |
| Single-hue charts | Identity comes from axis labels, so no rainbow palette; navy passes contrast; screen-reader tables included | Less "colourful" dashboard by design |
| In-memory dev database and dev-only auth bypass | Reviewers can run everything in two commands, without accounts | Must never ship: guarded by `NODE_ENV` and Clerk-key checks |

## Testing

`backend/tests` holds 45 integration tests run against an in-memory MongoDB through the real Express app. They cover:
- auth and roles, including first-login sync, admin by email, relinking seeded users, mass-assignment protection and operator injection
- listing filters and visibility
- ownership rules for listings and leads
- auto-assignment, honeypot handling, pipeline side effects and re-opening, and conversion idempotency
- customer matching, task buckets and completion
- dashboard scoping

The UI flows (inquiry, lead lifecycle, pipeline drag and drop, task completion, property create → visible on the website, agent scoping) were checked end to end with Playwright against the running app during development.
