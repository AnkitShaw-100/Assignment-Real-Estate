# Niwas — Product Requirements Document

> Real estate website + CRM platform. Demo assignment for Anuverse Technologies.
> Stack: React (Vite) · Node/Express · MongoDB Atlas · Clerk · Cloudinary · Vercel.
> Deadline: 7 days from 2026-10-19 → **submit by 2026-10-26**.

---

## 1. Goal

Build one product with two faces:

1. **Website** — buyers and renters browse residential and commercial properties, filter them, read details and send an inquiry.
2. **CRM** — agents and admins manage properties, leads, customers, the sales pipeline and their follow-up tasks from one dashboard.

The two connect at one point: **a website inquiry becomes a Lead in the CRM**, assigned to an agent, and moves through the pipeline until it is Won (sale) or Lost.

### Success criteria (what the reviewer must be able to do)
- Open the live site, filter properties, open a detail page, submit an inquiry.
- Sign in as admin (demo credentials in README), see that inquiry as a new lead on the dashboard.
- Move the lead across the pipeline, log an interaction, create a follow-up task, mark it Won and see sales numbers update.
- Sign in as an agent and see only their own leads/customers/tasks.
- Add, edit and delete a property with image upload, and see it on the public site.

---

## 2. Users & roles

Authentication is handled by **Clerk**. Authorization (who can do what) is **our own code**: the role is stored on the Mongo `User` document and enforced by Express middleware.

| Role | How they get it | Can do |
|---|---|---|
| **buyer** | Default on first sign-in | Browse, save properties, send inquiries (prefilled), see "My inquiries" |
| **agent** | Promoted by admin | CRM access scoped to records **assigned to them**; create/edit properties they list |
| **admin** | Email listed in `ADMIN_EMAILS` env, or promoted by another admin | Everything, incl. team management, reassigning leads, deleting any record |

Anonymous visitors can browse and submit inquiries without signing in.

### User sync (no webhook needed)
On any authenticated API call, `syncUser` middleware looks up the Mongo user by `clerkId`. If missing, it fetches the profile from Clerk's backend API and creates it (role `admin` if the email is in `ADMIN_EMAILS`, otherwise `buyer`). When an admin changes a role, the server also writes it to Clerk `publicMetadata.role` so the frontend can route without an extra request.

*Why:* webhooks need a public URL and raw-body signature checks, which are fragile on serverless and in local dev. Lazy sync is simpler and always consistent.

### Permission matrix
| Resource | Public | buyer | agent | admin |
|---|---|---|---|---|
| Properties — read published | ✅ | ✅ | ✅ | ✅ |
| Properties — create/update | | | own | all |
| Properties — delete | | | own | all |
| Leads — create (inquiry) | ✅ | ✅ | ✅ | ✅ |
| Leads — read/update | | own inquiries (read) | assigned | all |
| Leads — delete / reassign | | | | ✅ |
| Customers | | | assigned | all |
| Tasks | | | assigned | all |
| Users / roles | | self | self | all |
| Dashboard stats | | | own scope | global |

---

## 3. Functional requirements

### 3.1 Website

**Home** (`/`). Matches `docs/reference/homepage-mockup.webp`, top to bottom:
1. Hero: full-bleed house image in a rounded frame, nav overlaid, headline "Discover heavenly homes", search pill (location + Search).
2. Partner logo strip.
3. "Our story": image, copy, rotating circular "Explore properties" badge.
4. Popular listings: horizontal carousel with one expanded feature card, prev/next arrows.
5. Trust numbers: navy band with 4 stats (pulled from the API: total sales volume, active listings, partner agencies, satisfaction).
6. Featured homes: 4-up carousel.
7. Testimonial: quote, circular photo, gold quote badge.
8. CTA band ("Let's find your dream home") with badge.
9. Footer: brand, quick links, property categories, social.

**Listings** (`/properties`)
- Filters: **location** (city/area text, autocomplete from existing cities), **price** min/max, **category** residential/commercial, **type** (villa, apartment, house, penthouse, office, shop, warehouse, land), **bedrooms** (Any, 1, 2, 3, 4, 5+), **purpose** buy/rent, sort (newest, price ↑, price ↓).
- Filters live in the URL query string (shareable, back button works).
- Paginated grid (12 per page), skeleton loading, empty state with "Clear filters".
- Mobile: filters in a bottom sheet.

**Property detail** (`/properties/:slug`)
- Image gallery (hero + thumbnails + fullscreen lightbox, swipe on mobile).
- Title, location, price (with "/month" for rent), status badge.
- Key facts: beds, baths, area (sq ft), type, year built, parking.
- Description, amenities grid with icons.
- Agent card (name, photo, phone, email).
- **Inquiry form**: name, email, phone, message, intent (buy/rent/visit), preferred date. Prefilled when signed in.
- Similar properties (same type & city).
- Save (heart) for signed-in buyers.

**Other**: About, Contact (general inquiry → Lead with source `website`, no property), Saved (`/saved`), My inquiries (`/account/inquiries`), 404.

**Responsive**: desktop ≥1280, laptop 1024, tablet 768, mobile 375. No horizontal scroll at any width.

### 3.2 CRM dashboard (`/dashboard`, agent + admin only)

**Overview**
- KPI cards: total properties (available), new leads (last 30 days, with Δ vs previous 30), active clients, sales closed (count + value, this month).
- Charts: sales value by month (12 months), leads by source, pipeline funnel (count per stage), lead conversion rate.
- "Today" panel: tasks due today + overdue, upcoming follow-ups.
- Recent leads list.

**Leads** (`/dashboard/leads`)
- Table: name, contact, property, source, status, assigned agent, follow-up date, created.
- Search, filter by status/source/agent/date, sort, pagination.
- Create lead manually (sources: website, referral, walk-in, phone, social, portal).
- Detail drawer: edit fields, change status, set follow-up date, notes, linked property, **convert to customer**, activity log.
- Overdue follow-ups highlighted.

**Pipeline** (`/dashboard/pipeline`)
- Kanban columns: New → Contacted → Qualified → Site visit → Negotiation → Won | Lost.
- Drag & drop to change stage (optimistic update, rollback on error). Keyboard accessible.
- Column header shows count + total deal value.
- Moving to **Won** asks for final deal value and auto-creates/links a Customer; property status → sold/rented.
- Moving to **Lost** asks for a reason.

**Customers** (`/dashboard/customers`)
- List with search & type filter (buyer, renter, investor, seller).
- Profile: contact info, requirements (budget range, preferred locations, types, bedrooms), assigned agent, linked leads, deals.
- **Interaction history** timeline: call, email, meeting, site visit, note — add new entries inline.
- **Matching properties**: listings that fit the customer's requirements.

**Tasks** (`/dashboard/tasks`)
- Grouped: Overdue · Today · Upcoming · Done.
- Fields: title, description, due date/time, priority (low/medium/high), status, assignee, linked lead or customer.
- Quick-add, complete with a checkbox, admin can assign to any agent.
- Setting a lead's follow-up date auto-creates a task.

**Properties** (`/dashboard/properties`)
- Table/grid with status filter (draft, available, under offer, sold, rented).
- Create/edit form: all fields from §5, amenities multiselect, **image upload to Cloudinary** (drag-drop, reorder, set cover, delete), publish toggle, featured toggle.
- Delete with confirmation (also removes Cloudinary images).

**Team** (`/dashboard/team`, admin only)
- List users, change role (buyer/agent/admin), see each agent's lead count & closed deals.

---

## 4. API (REST, JSON, prefix `/api`)

Errors always return `{ "error": { "message": string, "details"?: object } }` with the right status code.
Lists return `{ data: [], page, limit, total }`.

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/health` | public | |
| GET | `/properties` | public | query: q, city, category, type, purpose, minPrice, maxPrice, beds, sort, page, limit, featured |
| GET | `/properties/cities` | public | distinct cities for autocomplete |
| GET | `/properties/:slug` | public | |
| GET | `/properties/:slug/similar` | public | |
| POST | `/properties` | agent, admin | |
| PATCH | `/properties/:id` | owner agent, admin | |
| DELETE | `/properties/:id` | owner agent, admin | |
| POST | `/uploads/signature` | agent, admin | Cloudinary signed upload params |
| GET | `/stats/public` | public | numbers for the trust band |
| POST | `/leads/inquiry` | public, rate-limited | creates Lead, auto-assigns agent (round-robin by fewest open leads) |
| GET | `/leads` | agent (scoped), admin | filters, pagination |
| GET | `/leads/mine` | buyer | inquiries by the signed-in user's email |
| POST | `/leads` | agent, admin | manual lead |
| GET | `/leads/:id` | scoped | |
| PATCH | `/leads/:id` | scoped | |
| PATCH | `/leads/:id/stage` | scoped | pipeline move; Won/Lost side effects |
| POST | `/leads/:id/convert` | scoped | → Customer |
| DELETE | `/leads/:id` | admin | |
| GET/POST | `/customers` | agent (scoped), admin | |
| GET/PATCH/DELETE | `/customers/:id` | scoped (delete admin) | |
| POST | `/customers/:id/interactions` | scoped | |
| GET | `/customers/:id/matches` | scoped | matching properties |
| GET/POST | `/tasks` | scoped | query: status, due (overdue/today/upcoming), assignee |
| PATCH/DELETE | `/tasks/:id` | scoped | |
| GET | `/dashboard/overview` | agent (scoped), admin | KPIs + chart series |
| GET | `/users/me` | signed-in | |
| PATCH | `/users/me` | signed-in | phone, etc. |
| POST/DELETE | `/users/me/saved/:propertyId` | signed-in | |
| GET | `/users` | admin | |
| PATCH | `/users/:id/role` | admin | also updates Clerk publicMetadata |

---

## 5. Data models (Mongoose)

**User**: clerkId (unique), name, email (unique), avatar, phone, role (`buyer|agent|admin`), savedProperties [Property], active, timestamps.

**Property**: title, slug (unique), description, category (`residential|commercial`), type (enum §3.1), purpose (`sale|rent`), price, currency (default USD), location { address, area, city, country, coordinates? }, bedrooms, bathrooms, areaSqft, parking, yearBuilt, amenities [string], images [{ url, publicId, alt }], coverIndex, status (`draft|available|under_offer|sold|rented`), featured, views, agent (User), timestamps.
Indexes: text (title, description, location.city, location.area), { status, category, type, purpose, price }, { 'location.city': 1 }.

**Lead**: name, email, phone, message, intent (`buy|rent|visit|general`), source (`website|referral|walk_in|phone|social|portal`), property (Property?), status (`new|contacted|qualified|site_visit|negotiation|won|lost`), assignedTo (User), followUpDate, dealValue, lostReason, customer (Customer?), notes [{ body, author, createdAt }], activity [{ type, from, to, by, at }], createdBy (User?), timestamps.
Indexes: { assignedTo, status }, { followUpDate }, { email }.

**Customer**: name, email, phone, type (`buyer|renter|investor|seller`), requirements { budgetMin, budgetMax, locations [string], types [string], bedrooms }, assignedAgent (User), leads [Lead], deals [{ property, value, closedAt }], interactions [{ kind: `call|email|meeting|site_visit|note`, summary, at, by }], tags [string], timestamps.

**Task**: title, description, dueAt, priority (`low|medium|high`), status (`open|done`), assignee (User), lead?, customer?, createdBy, completedAt, timestamps.

---

## 6. Non-functional requirements

**Security**
- Clerk session JWT verified on every protected route (`@clerk/express`).
- Role and ownership checks in middleware/services, never trusted from the client.
- `helmet`, CORS allowlist (`CLIENT_URL`), `express-rate-limit` (inquiries: 5/10 min per IP; API: 300/15 min).
- Zod validation on every body/query; unknown keys stripped. Mongo operator injection blocked (`$`/`.` keys sanitized).
- Mass-assignment safe: only whitelisted fields updatable; role only via admin endpoint.
- Cloudinary uploads signed server-side; API secret never reaches the browser.
- Secrets in env vars only; `.env.example` committed.

**Performance**
- Mongo connection cached across serverless invocations.
- Lean queries + projections for lists; indexes as above.
- Images via Cloudinary/Unsplash transforms (`w`, `q=auto`, `f=auto`), `loading="lazy"`, explicit dimensions (no layout shift).
- Route-level code splitting (website vs dashboard bundles).
- Lighthouse target on home: Performance ≥ 85, Accessibility ≥ 95.

**Reliability & UX**
- Every async view has loading (skeleton), empty and error states.
- Toasts for mutations; optimistic updates on pipeline + task toggles.
- Central Express error handler; 404 handler; async errors caught.

**Accessibility**
- Semantic landmarks, labelled form controls, visible focus rings, keyboard-operable carousel/kanban/dialogs, contrast AA, `prefers-reduced-motion` honored.

---

## 7. Tech stack & key decisions

| Area | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite | Required React; Vite = fast dev/build |
| Styling | Tailwind CSS with design tokens | Tokens from DESIGN.md in `tailwind.config`, consistent and fast |
| Motion | Framer Motion | Spring physics, layout/shared-element transitions, reduced-motion support |
| Data fetching | TanStack Query + axios | Caching, optimistic updates, loading/error states for free |
| Forms | react-hook-form + Zod | Same schema style as the server |
| Charts | Recharts | Composable, React-native |
| Drag & drop | @dnd-kit | Accessible (keyboard) DnD for the kanban |
| Auth | Clerk | Requested; we own RBAC |
| Backend | Express on Vercel serverless | Required Express; single deploy platform |
| DB | MongoDB Atlas + Mongoose | Required Mongo; Compass for inspection |
| Images | Cloudinary signed uploads + Unsplash seed | Persistent storage that works on serverless |

**Repo layout**
```
/frontend  React app (website + dashboard)
/backend   Express API (api/index.js = Vercel entry, src/app.js = app)
/docs      PRD.md, DESIGN.md, ARCHITECTURE.md, reference/
README.md
```

---

## 8. Seed data
- 1 admin, 3 agents, 2 buyers (Clerk users created manually; seed links by email).
- ~24 properties across 8 cities, mix of residential/commercial, sale/rent, with Unsplash images.
- ~40 leads spread across all pipeline stages and sources over the last 6 months (so charts look real).
- ~15 customers with interactions, ~25 tasks (some overdue, some today).

---

## 9. Out of scope
Email/SMS notifications, live chat, maps, payments, multi-language, mortgage calculator, public buyer reviews.

---

## 10. Milestones (7 days)

| Day | Deliverable |
|---|---|
| 1 | Docs, repo scaffold, Tailwind tokens, Express app + DB connection, models, seed script |
| 2 | Clerk auth + RBAC middleware, properties API, leads/customers/tasks APIs with validation |
| 3 | Website: layout, nav, home page (all mockup sections) |
| 4 | Website: listings + filters, detail page, inquiry form, saved, my inquiries |
| 5 | CRM: shell, overview + charts, leads table/drawer, pipeline kanban |
| 6 | CRM: customers, tasks, properties CRUD + Cloudinary, team |
| 7 | Responsive/a11y/motion polish, deploy both to Vercel, README + ARCHITECTURE.md, final QA |

## 11. Submission checklist
- [ ] Live URL (client) + API URL
- [ ] GitHub repo, clean commit history
- [ ] README: features, stack, setup, env vars, demo logins, screenshots
- [ ] ARCHITECTURE.md: diagram, data flow, key decisions
- [ ] Demo admin + agent credentials work on the live site
