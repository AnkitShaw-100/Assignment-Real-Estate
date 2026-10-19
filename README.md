# Niwas: Real Estate Website & CRM

A real estate website where buyers and renters browse and inquire about properties, connected to a CRM where agents and admins manage listings, leads, customers, the sales pipeline and follow-up tasks.

Built with **React, Node.js/Express and MongoDB** for the Anuverse Technologies full-stack assignment.

| | |
|---|---|
| **Live website** | _add after deploy_ |
| **API** | _add after deploy_ |
| **Demo logins** | see [Demo accounts](#demo-accounts) |

![Home page](docs/screenshots/home.webp)

---

## Features

### Website
- **Home page** built from the provided design: hero with location search, partner strip, story, popular and featured carousels, live trust numbers, testimonial, call to action.
- **Property search** with filters for location, buy or rent, residential or commercial, type, price range and bedrooms. Filters live in the URL, so results are shareable and the back button works. Includes sorting, pagination, and a bottom-sheet filter panel on mobile.
- **Property pages** with photo gallery and full-screen lightbox (keyboard and swipe), key facts, amenities, agent card, similar homes and an **inquiry form** that becomes a CRM lead.
- **Accounts (Clerk)**: save homes with the heart button, and see the status of your inquiries under "My inquiries".
- **Responsive** from 360 px phones to wide desktops, with no horizontal scroll at any width (checked at 360, 390, 768, 1024 and 1440 px).

### CRM (`/dashboard`, agents and admins)
- **Overview**: KPIs (available properties, new leads with change vs the previous 30 days, active clients, sales this month), 12-month sales chart, pipeline and lead-source charts, today's and overdue tasks, recent leads.
- **Leads**: searchable, filterable table (stage, source, follow-up, agent). A detail drawer covers contact info, stage, assignment, follow-up date, deal value, notes, an activity log, and conversion to a customer.
- **Pipeline**: drag-and-drop Kanban (New → Contacted → Qualified → Site visit → Negotiation → Won/Lost) with optimistic updates. Winning a deal asks for the final value, creates or updates the customer and marks the property sold or rented. Losing asks for a reason.
- **Customers**: profiles with requirements (budget, cities, types, bedrooms), an interaction timeline (calls, emails, meetings, visits, notes), deals, linked leads and **matching properties**.
- **Tasks**: overdue / today / upcoming / completed, quick add, one-tap completion. Setting a follow-up date on a lead creates the task automatically.
- **Properties**: add, edit and delete listings, with **photo upload to Cloudinary** (drag and drop, reorder, choose cover), draft/available/under offer/sold/rented status, and a featured flag.
- **Team** (admin only): promote buyers to agents, change roles, deactivate accounts, see each agent's open leads, deals and revenue.

### Roles

| | Visitor | Buyer | Agent | Admin |
|---|:-:|:-:|:-:|:-:|
| Browse, search, send inquiries | ✅ | ✅ | ✅ | ✅ |
| Save homes, see own inquiries | | ✅ | ✅ | ✅ |
| CRM: leads, customers, tasks | | | **own only** | all |
| Add and edit listings | | | **own only** | all |
| Reassign leads, delete records, manage team | | | | ✅ |

Agents only ever see records assigned to them. The API enforces this on every request; hiding things in the UI is a convenience, not the protection.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Motion (Framer Motion), React Router, TanStack Query, React Hook Form + Zod, Recharts, dnd-kit |
| Backend | Node.js 22, Express 5, Mongoose, Zod, Helmet, express-rate-limit |
| Database | MongoDB Atlas |
| Auth | Clerk (sign-in) + our own role-based access control |
| Images | Cloudinary (signed direct uploads), Unsplash for seed photos |
| Tests | Vitest + Supertest + mongodb-memory-server (45 API tests) |
| Hosting | Vercel (frontend and API as two projects) |

Architecture, data flow and the reasoning behind each decision: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## Run it locally

Requirements: **Node.js 20+** and npm.

### Option A: zero setup (about 2 minutes)

No database or accounts needed. The API runs on an in-memory MongoDB seeded with demo data, and a **development-only** sign-in bypass lets you use the CRM without Clerk.

```bash
# terminal 1: API on http://localhost:5000
cd backend
npm install
npm run dev:memory

# terminal 2: website on http://localhost:5173
cd frontend
npm install
echo VITE_DEV_USER=admin+clerk_test@niwas.app > .env.local   # act as the seeded admin
npm run dev
```

Open http://localhost:5173 and go to **/dashboard**. To act as an agent instead, set `VITE_DEV_USER=agent+clerk_test@niwas.app` and restart `npm run dev`. Data resets when the API stops.

> The bypass is refused when `NODE_ENV=production` and ignored whenever Clerk keys are set, so it can't reach a deployed site.

### Option B: real setup (Atlas + Clerk + Cloudinary)

1. **MongoDB Atlas**: create a free cluster and a database user. Under *Network access*, allow `0.0.0.0/0` (Vercel has no fixed IPs). Copy the connection string.
2. **Clerk**: create an application with email and Google sign-in, then copy the publishable and secret keys.
3. **Cloudinary** (optional; without it, photos can be added by link): copy the cloud name, API key and API secret.
4. Configure and run:

```bash
cd backend
cp .env.example .env          # fill in MONGODB_URI, CLERK_*, CLOUDINARY_*, ADMIN_EMAILS
npm install
npm run seed                  # demo listings, leads, customers and tasks
npm run dev

cd ../frontend
cp .env.example .env.local    # fill in VITE_CLERK_PUBLISHABLE_KEY
npm install
npm run dev
```

5. Sign up with an email listed in `ADMIN_EMAILS` and you become an admin. Promote other accounts from **Dashboard → Team**.

### Environment variables

**backend/.env**

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | yes | Atlas connection string |
| `CLIENT_URL` | yes | Frontend origin(s) allowed by CORS and Clerk, comma separated |
| `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` | yes | Verify session tokens and read user profiles |
| `ADMIN_EMAILS` | yes | Emails that become admin on first sign-in |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | no | Photo uploads |
| `DEV_AUTH` | no | `true` enables the local sign-in bypass (refused in production) |

**frontend/.env.local**

| Variable | Required | Purpose |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | yes | Clerk sign-in |
| `VITE_API_URL` | in production | Deployed API origin, for example `https://niwas-api.vercel.app` (in dev, `/api` is proxied) |
| `VITE_DEV_USER` | no | Dev builds only: act as a seeded user without Clerk |

### Scripts

| Where | Command | What it does |
|---|---|---|
| backend | `npm run dev` | API with auto-reload (needs `.env`) |
| backend | `npm run dev:memory` | API on an in-memory, pre-seeded database |
| backend | `npm run seed` | Reset the database to the demo data |
| backend | `npm test` | Run the 45 API tests |
| frontend | `npm run dev` / `npm run build` | Dev server / production build |

---

## Demo accounts

`npm run seed` creates these staff accounts. Sign up through Clerk with the same email and you're linked to the seeded account, keeping its role and data. In a Clerk development instance, `+clerk_test` emails accept the verification code **424242**.

| Role | Email |
|---|---|
| Admin | `admin+clerk_test@niwas.app` (or the first email in `ADMIN_EMAILS`) |
| Agent | `agent+clerk_test@niwas.app` (Aarav Mehta) |
| Agent | `sofia+clerk_test@niwas.app` (Sofia Lindqvist) |
| Agent | `daniel+clerk_test@niwas.app` (Daniel Okafor, commercial) |

---

## Deploy to Vercel

Create **two Vercel projects** from this repository:

| Project | Root directory | Environment variables |
|---|---|---|
| API | `backend` | everything from `backend/.env`, with `NODE_ENV=production` and `CLIENT_URL=https://<your-frontend>.vercel.app` |
| Website | `frontend` | `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_URL=https://<your-api>.vercel.app` |

- `backend/vercel.json` routes every request to `api/index.js`, which exports the Express app as a serverless function.
- `frontend/vercel.json` rewrites all paths to `index.html` so deep links work.
- In Clerk, add the website's domain under *Domains / Allowed origins*.
- Run `npm run seed` once against the Atlas database from your machine.

---

## Project structure

```
backend/
  api/index.js            Vercel entry (exports the Express app)
  src/app.js              middleware chain and routes
  src/auth/               Clerk provider, dev-only provider
  src/middleware/         auth + roles, validation, sanitising, errors
  src/models/             User, Property, Lead, Customer, Task
  src/modules/<feature>/  routes, controllers, schemas, services per feature
  src/scripts/            seed and dev:memory
  tests/                  API tests (in-memory MongoDB)
frontend/
  src/auth/               AuthContext: wraps Clerk, exposes role
  src/components/ui/      design-system primitives
  src/components/site/    website components
  src/components/crm/     CRM components
  src/pages/site/         public pages
  src/pages/crm/          dashboard pages (lazy-loaded)
  src/hooks/              TanStack Query hooks per resource
  src/lib/                api client, formatting, motion tokens, uploads
docs/
  PRD.md                  requirements
  DESIGN.md               design system and motion rules
  ARCHITECTURE.md         architecture and key decisions
  screenshots/
```

## Screenshots

| | |
|---|---|
| ![Listings](docs/screenshots/listings.webp) | ![Property](docs/screenshots/detail.webp) |
| ![CRM overview](docs/screenshots/overview.webp) | ![Pipeline](docs/screenshots/pipeline.webp) |
| ![Lead drawer](docs/screenshots/lead.webp) | ![Mobile](docs/screenshots/home-mobile.webp) |
