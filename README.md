# Tsvaga — Lost & Found (MVP-1)

A lost & found web application: the public searches found items, registered users create alerts and get notified by email when a matching item is logged, and admins manage the item catalog.

**Version:** 0.1.2 (`lib/version.ts`)

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.1 (App Router) |
| Language | TypeScript 5.9 (strict) |
| UI | React 19.2, Tailwind CSS 4 |
| Database | PostgreSQL |
| ORM | Prisma 6.19 |
| Auth | NextAuth 4.24 (credentials + optional Google OAuth) |
| Validation | Zod 4 |
| Uploads | Uploadthing 7 |
| Icons | lucide-react |

## Getting Started

### Prerequisites

- Node.js 20+ (developed on Node 22)
- A PostgreSQL database (Neon, Railway, Supabase, or local)
- An Uploadthing account/token (only needed for image uploads)

### Setup

```bash
# 1. Install dependencies (runs `prisma generate` automatically)
npm install

# 2. Configure environment
cp .env.example .env
# then edit .env and fill in the values

# 3. Create the database schema
npx prisma db push

# 4. Seed sample data (categories, locations, items, users)
npm run prisma:seed

# 5. Start the dev server
npm run dev
```

App runs at http://localhost:3000.

### Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Session/JWT signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | Base URL (`http://localhost:3000` in dev, production domain on Vercel) |
| `UPLOADTHING_TOKEN` | Yes for uploads | Full Uploadthing token (`ey...`), not the API key |
| `GOOGLE_CLIENT_ID` | No | Enables Google sign-in when set together with the secret |
| `GOOGLE_CLIENT_SECRET` | No | Enables Google sign-in when set together with the ID |
| `RESEND_API_KEY` | For email | Resend API key; without it emails go to the console (dev) or are dropped (prod) |
| `EMAIL_FROM` | For email | Verified sender, e.g. `Tsvaga <notifications@yourdomain.com>` |
| `ADMIN_EMAIL` | For contact form | Inbox for contact enquiries (defaults to `EMAIL_FROM`) |

Google OAuth is registered conditionally — leave both unset to run credentials-only.

### Seed Accounts (development only)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@lostandfound.com` | `admin123` |
| User | `user@example.com` | `user123` |

The seed script clears users, items, alerts, categories, and locations before inserting. Never run it against production.

To create or promote an admin without touching other data:

```bash
npm run admin:create -- admin@yourdomain.com
# prompts for a password, or set ADMIN_PASSWORD
```

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (flat config, `eslint .`) |
| `npm run type-check` | `tsc --noEmit` |
| `npm test` | Unit tests (Node test runner via tsx) |
| `npm run admin:create` | Create/promote an admin account |
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run prisma:push` | Push the schema to the database |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:deploy` | Apply committed migrations (production) |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:seed` | Seed sample data |

## Features

### Public (no auth)
- Home page with search
- `/search` — keyword + category + location filtering, pagination
- `/search/advanced` — document-aware search (document number, year, issuing authority, holder name)
- `/items/[id]` — item detail with image gallery and contact-admin form (stored in `ContactRequest`, emailed to the admin, rate limited)

### Registered users
- `/register`, `/login` (credentials, optional Google)
- `/dashboard` — alert statistics
- `/alerts` — full alert CRUD, scoped to the signed-in user
- Alerts support document-specific fields (document number, year, issuing authority, holder name) and color

### Admin (`ADMIN` role)
- `/admin/dashboard`
- `/admin/items` — create (modal), search, edit, delete, upload images
- `/admin/items/[id]/edit`
- `/admin/categories` — category CRUD
- `/admin/locations` — location CRUD
- Mark item as returned (triggers alert matching for that item)

### Alert matching
Runs when an admin creates an item and when an item is marked returned. An alert matches when:
1. Every keyword in the alert appears in the item title + description (case-insensitive)
2. Category matches exactly, if the alert has a category
3. Location matches exactly, if the alert has a location
4. Document fields match, if the alert is document-specific
5. Color matches, if the alert specifies one

Matches are emailed to the alert owner via Resend when email is configured; otherwise they are logged to the console.

## Project Structure

```
app/
  api/            Route handlers (admin, alerts, auth, categories, contact, items, locations)
  admin/          Admin dashboard, items, categories, locations
  alerts/         User alert management
  dashboard/      User dashboard
  items/[id]/     Public item detail
  search/         Search page, advanced search, shared components
components/       Navbar, AlertForm, ContactForm, AuthProvider, UI primitives
lib/              auth config, auth guards, prisma client, schemas, uploadthing
prisma/           schema.prisma, seed.ts
memory-bank/      Project documentation (brief, context, patterns, progress)
public/           Static assets (placeholder image, favicon, brand)
```

## Access Control

- Page routes are guarded server-side in `lib/auth-utils.ts` via `requireAuth()` / `requireAdmin()`.
- API routes call `checkAdminAccess()` and return 401/403 JSON.
- There is **no** `middleware.ts` — every protected page/route enforces access individually.

## Deployment

Target is Vercel + Neon:
1. Create the database and copy its connection string.
2. Import the repo into Vercel and set the variables from the table above.
3. Set `NEXTAUTH_URL` to the production domain (e.g. `https://your-app.vercel.app`).
4. Apply migrations: `npm run prisma:deploy`. See the baseline note below.
5. Item images upload to Uploadthing — set `UPLOADTHING_TOKEN` in the Vercel environment or uploads will fail.
6. Verify the Resend sender domain, then set `RESEND_API_KEY`, `EMAIL_FROM`, and `ADMIN_EMAIL`.
7. Create the first admin: `npm run admin:create -- admin@yourdomain.com`.

### Migrations baseline

`prisma/migrations/20251021000000_baseline` describes the schema as it existed before
migrations were tracked. The live database already contains those tables, so mark the
baseline as applied once, then deploy the remaining migrations:

```bash
npx prisma migrate resolve --applied 20251021000000_baseline
npm run prisma:deploy
```

New environments (including CI and fresh databases) should run `npm run prisma:deploy`
only — it applies the baseline and everything after it.

## Remaining Work

Closed in the production-hardening pass (2026-10-21): real email via Resend with console
fallback, persisted contact requests, Postgres-backed rate limiting on contact/register/login,
Prisma migrations, admin bootstrap script, security headers + CSP, restricted image hosts,
error boundaries, Uploadthing cleanup on delete, flat ESLint config, and unit tests.

Still open:
- No error-tracking service (Sentry et al.) — errors are logged to the platform logs
- Contact requests are stored but have no admin UI yet
- No password reset or email-verification flow
- No CI secret scanning/dependency audit beyond GitHub defaults
- Legacy `/public/uploads` handling remains in `.gitignore` and `next.config.js`; current uploads go to Uploadthing

## Documentation

Project context and decisions live in [`memory-bank/`](memory-bank/):
`projectbrief.md`, `productContext.md`, `techContext.md`, `systemPatterns.md`, `activeContext.md`, `progress.md`.
