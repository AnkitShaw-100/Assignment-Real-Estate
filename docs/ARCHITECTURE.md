# Architecture

## Overview

```
            ┌──────────────────────── Browser ────────────────────────┐
            │  React SPA (Vite)                                       │
            │   ├─ Website  /, /properties, /properties/:slug, …      │
            │   └─ CRM      /admin/* (lazy-loaded, role-gated)        │
            │  TanStack Query cache · AuthContext (session token)     │
            └──────────────────────────┬──────────────────┬───────┘
                   REST/JSON + Bearer  │   signed upload  │
                   (JWT from /auth/*)  ▼                  ▼
                       ┌───────────────────────┐   ┌────────────┐
                       │ Express 5 API         │   │ Cloudinary │
                       │ (Vercel function)     │──▶│ images     │
                       │ auth → roles → Zod →  │   └────────────┘
                       │ controller/service    │
                       └──────────┬────────────┘
                                          ▼
                                 ┌─────────────────┐
                                 │ MongoDB Atlas   │
                                 │ (Mongoose)      │
                                 └─────────────────┘
```

Two deployables in one repository: `frontend/` (static SPA) and `backend/` (Express app exported as a Vercel serverless function). They share no code. Enum values are mirrored in `backend/src/models/enums.js` and `frontend/src/lib/constants.js`.

## Request lifecycle (API)

Every request passes through the same chain in `backend/src/createApp.js`:

1. **helmet**: security headers.
2. **CORS allowlist**: only origins in `CLIENT_URL`.
3. **JSON body**: limited to 1 MB; malformed JSON becomes a 400.
4. **sanitize**: strips `$`- and `.`-prefixed keys to block NoSQL operator injection. (`express-mongo-sanitize` doesn't support Express 5.)
5. **rate limit**: 300 requests per 15 minutes per IP on the API, and 5 per 10 minutes on the public inquiry form, which also has a honeypot field.
6. **connectDB**: the connection promise is cached on `globalThis`, so a warm serverless instance reuses one pool instead of reconnecting per request.
7. **attachUser**: verifies the Bearer JWT and loads our MongoDB user for its id (see below).
8. **route guards**: `requireAuth`, `requireStaff`, `requireAdmin`.
9. **validate(Zod)**: parses params, query and body. Unknown keys are dropped, which prevents mass assignment (for example, sending `role: "admin"` to `/users/me` does nothing).
10. **controller / service**.
11. **errorHandler**: every error leaves as `{ error: { message, details? } }` with the right status. Zod and Mongoose validation errors become 400 with per-field messages, duplicate keys become 409, and unknown errors become 500 without leaking internals.

## Authentication vs authorization

- **Authentication** (*who is this?*): `POST /auth/register` and `POST /auth/login`. Passwords are hashed with bcrypt (cost 12) and never leave the database (`select: false`). A successful call returns a signed JWT (HS256, `JWT_SECRET`, 7 days) that holds only the user id.
- **Authorization** (*what can they do?*): the role (`buyer | agent | admin`) lives on our own `User` document. `attachUser` reads it from the database on **every** request instead of trusting the token, so role changes and deactivation take effect immediately, without token revocation lists.

**Accounts and admins.** Anyone can register on the website; every public sign-up is a `buyer` (saves homes, tracks inquiries), and a `role` sent to `/auth/register` is ignored. Staff sign in at `/admin/login`, which sends `staff: true`; the API refuses that sign-in for accounts without CRM access. The admin is defined by `ADMIN_EMAIL` / `ADMIN_PASSWORD` in the server settings: signing in with them (compared in constant time) creates the admin account on first use and keeps it in sync, and that email can't be registered publicly. The admin adds agents under Team (`POST /users`) with a starting password. Nobody can make themselves staff.

**Hardening.** The auth routes have their own rate limit (20 attempts per 15 minutes per IP). Login returns the same message for an unknown email and a wrong password, and compares against a dummy hash when the email doesn't exist so response times don't reveal which emails are registered. Passwords are capped at 72 characters, bcrypt's input limit.

**Why a Bearer token, not a cookie.** The website and API are separate Vercel projects on different domains. Cross-site cookies are blocked by Safari and Brave by default, so the token is kept in `localStorage` and sent as `Authorization: Bearer`. The trade-off is exposure to XSS, mitigated by React's escaping, Helmet's headers and short-ish token lifetime.

**Row-level scoping.** `scopeFilter(user, field)` returns `{}` for admins and `{ [field]: user._id }` for agents. It is applied to every list query (leads by `assignedTo`, customers by `assignedAgent`, tasks by `assignee`, listings by `agent`). `assertInScope` returns **404 rather than 403** for other agents' records, so IDs can't be probed. Dashboard aggregates use the same scope, so an agent's KPIs are their own.

**Tested through the real path.** API tests sign real tokens with the same helper the server uses, and cover registration, login, forged and expired tokens, deactivated accounts and role changes.

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
- **AuthContext**: owns the session token. Components ask `useSession()` for `{ isSignedIn, me, role, isStaff, isAdmin, signIn, signUp, signOut }`. A 401 from the API clears the token, and signing in or out syncs across tabs. Route guards are a UX convenience; the API is the real gate.
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
| Own email/password auth with JWT, roles read from the DB per request | No third-party dependency or keys; role changes apply instantly; everything is covered by our tests | No password reset or email verification yet |
| 404 instead of 403 for out-of-scope records | Doesn't reveal that another agent's record exists | Slightly less explicit for debugging |
| Signed direct-to-Cloudinary uploads | Bypasses Vercel's 4.5 MB body limit and keeps the secret server-side | Two round trips per upload |
| Zod on both client and server | Same rules everywhere; unknown keys stripped server-side | Schemas are duplicated (no shared package, to keep two independent deployables) |
| URL as UI state | Shareable filtered views, working back button | Slightly more code than local state |
| Single-hue charts | Identity comes from axis labels, so no rainbow palette; navy passes contrast; screen-reader tables included | Less "colourful" dashboard by design |
| In-memory dev database with seeded staff logins | Reviewers can run everything in two commands, without accounts | Demo password is public, so `npm run seed` should not be run on production with defaults |

## Testing

`backend/tests` holds 45 integration tests run against an in-memory MongoDB through the real Express app. They cover:
- auth and roles, including first-login sync, admin by email, relinking seeded users, mass-assignment protection and operator injection
- listing filters and visibility
- ownership rules for listings and leads
- auto-assignment, honeypot handling, pipeline side effects and re-opening, and conversion idempotency
- customer matching, task buckets and completion
- dashboard scoping

The UI flows (inquiry, lead lifecycle, pipeline drag and drop, task completion, property create → visible on the website, agent scoping) were checked end to end with Playwright against the running app during development.
