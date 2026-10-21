# System Patterns

**Last updated:** 2026-10-21

## Architecture

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Next.js App     │ ───► │  Route Handlers  │ ───► │   PostgreSQL     │
│  (App Router)    │      │  app/api/*       │      │   via Prisma     │
│  Server + Client │ ◄─── │  Zod validated   │ ◄─── │   Prisma Client  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        │                         │
        │                         ├─► Uploadthing (image upload)
        └─► NextAuth (JWT + Prisma adapter)
```

Layers: pages/server components → API route handlers → Prisma → PostgreSQL.
Auth is a cross-cutting concern provided by NextAuth v4 with JWT sessions.

## Data Model

Core models (see `prisma/schema.prisma`):

- **User** — `id`, `email` (unique), optional `password` (bcrypt), `name`, `image`,
  `role` (`USER` | `ADMIN`), relations to alerts, items, accounts, sessions
- **Account / Session / VerificationToken** — NextAuth adapter tables for OAuth
- **Item** — title, description, `categoryId` → `Category`, `customCategory`,
  `locationId` → `Location`, `status` (`AVAILABLE` | `RETURNED`), `imageUrls String[]`,
  `createdById` → User, `isDocument`, `documentNumber`, `documentYear`,
  `issuingAuthority`, `holderName`, `color`
- **DeletedItem** — flat archive copy of an item on delete (category/location as strings,
  no relation, plus `deletedAt`)
- **Alert** — `keywords`, category/location (FK + `customCategory`), `userId`,
  document fields, `color`
- **Category** / **Location** — admin-managed lookup tables with `isActive`;
  Location also stores address/lat/long
- **ContactRequest** — itemId + snapshotted title, name, email, message, createdAt;
  written before email so enquiries survive delivery failures
- **RateLimit** — `key` (e.g. `contact:203.0.113.7`), `count`, `windowEnds`; fixed-window
  counters used by the API rate limiter

Notes:
- Categories and locations are **tables**, not enums. "Other" is represented by
  `customCategory` free text.
- `imageUrls` stores paths (`/uploads/...` locally, or remote URLs).

## Auth & Authorization

- `lib/auth.ts` exports `authOptions` (NextAuth v4)
  - Providers: Credentials always; Google only if env vars are present
  - Session strategy: `jwt`; `jwt`/`session` callbacks copy `id` and `role`
  - `pages.signIn = "/login"`
- `lib/auth-utils.ts` provides guards:
  - `getCurrentUser()` — session user or `null`
  - `requireAuth()` — redirect to `/login`
  - `requireAdmin(returnJson?)` — redirect or 403 descriptor
  - `checkAdminAccess()` — `Response | null` for API handlers
- No global middleware. Every admin page/route calls the guard explicitly.
- Registration lives in `app/api/auth/register/route.ts` (Zod + bcrypt, role defaults to USER).

## API Patterns

```
GET    /api/items                    public search (q, category, location, page…)
GET    /api/items/[id]               public item detail
GET    /api/items/filters            categories + locations for filter UI
POST   /api/contact                  store ContactRequest + email admin (rate limited)

GET    /api/alerts                   user's alerts
POST   /api/alerts                   create alert
PATCH  /api/alerts/[id]              update (owner only)
DELETE /api/alerts/[id]              delete (owner only)

GET    /api/categories               list
POST   /api/categories               admin create
PATCH  /api/categories/[id]          admin update
DELETE /api/categories/[id]          admin delete

GET    /api/locations                list
POST   /api/locations                admin create
PATCH  /api/locations/[id]           admin update
DELETE /api/locations/[id]           admin delete

GET    /api/admin/items              admin list
POST   /api/admin/items              admin create + alert matching
PUT    /api/admin/items/[id]         admin update
DELETE /api/admin/items/[id]         admin delete (archives to DeletedItem)
POST   /api/admin/items/[id]/images  upload image
DELETE /api/admin/items/[id]/images/[index]  remove image
POST   /api/admin/items/[id]/mark-returned   status → RETURNED + alert matching
```

Conventions:
- Zod schemas at the top of each handler (or in `lib/alert-schemas.ts`)
- Errors as `Response.json({ error }, { status })`
- Next 16 dynamic params: `const { id } = await params`

## Alert Matching

Implemented twice, with the same rules:
`app/api/admin/items/route.ts` (on create) and
`app/api/admin/items/[id]/mark-returned/route.ts` (on return).

```
alert matches item when:
  1. every whitespace-split keyword of alert.keywords appears in
     `${title} ${description}` (lowercased)            [required]
  2. alert.categoryId    === item.categoryId            [if set]
  3. alert.locationId    === item.locationId            [if set]
  4. document fields equal: number, year, authority,
     holder name                                        [if alert.isDocument]
  5. alert.color         === item.color                 [if set]
```

Rules live in `lib/alert-matching.ts` (`matchesAlert`) so both call sites stay identical.
Matched users receive an email through `lib/email.ts` (Resend); failures are logged and
never block the request. No notification records are persisted and nothing is deduplicated —
add a `Notification` table if delivery history or idempotency is required.

## Flows

**Public search** — `/search` (server component reads searchParams) → `prisma.item.findMany`
with `contains`/`insensitive` filters + pagination → `ItemCard` list → `/items/[id]` →
contact modal → `POST /api/contact` → console log.

**Registration/login** — `/register` → `POST /api/auth/register` (bcrypt) → `/login` →
`signIn("credentials")` → JWT with role → redirect to `/dashboard` or `/admin/dashboard`.

**Alert lifecycle** — `/alerts` (requires auth) → `/api/alerts` CRUD → scoped by `userId`.

**Admin item creation** — modal → `POST /api/admin/items` (+ image uploads) → creates item →
fetches active alerts → `matchesAlert` → emails matches.

**Mark returned** — admin action → `POST .../mark-returned` → update status → re-run
matching → log.

**Delete item** — `DELETE /api/admin/items/[id]` → copy row (incl. colour and images) into
`DeletedItem` → delete original → best-effort `utapi.deleteFiles` for each image.

## Rate Limiting

- `lib/rate-limit.ts` — atomic fixed-window counters in Postgres
  (`INSERT … ON CONFLICT DO UPDATE`), so limits hold across serverless instances
- Budgets: contact 5 / 10 min per IP; register 5 / hour per IP; login 10 / 15 min per
  IP + email
- Fail-open on database errors (availability over blocking); stale rows cleaned opportunistically
- Responses use 429 with `Retry-After` via `tooManyRequests()`

## Security

- Zod validation on all write endpoints
- Security headers set in `next.config.js` (CSP, HSTS, X-Frame-Options DENY, nosniff,
  Referrer-Policy, Permissions-Policy); `poweredByHeader` disabled
- `images.remotePatterns` allowlists Uploadthing hosts only
- Prisma parameterized queries
- Ownership checks on alert routes (`userId` from session, never from the body)
- Admin checks on admin routes and pages
- bcrypt hashing (cost 10)
- React escaping for rendered content; no `dangerouslySetInnerHTML` usage
- Contact requests are stored and emailed; message bodies are never printed in production logs

## Frontend Patterns

- App Router with server components for data fetching; client components only for
  interactivity (`*Client.tsx`, forms, modals)
- Shared public components under `app/search/` (`ItemCard`, `Pagination`, forms,
  `SearchParamsContext`); shared app-wide components under `components/`
- Tailwind utility styling, full-width layouts, mobile menu in `Navbar`
- `components/AuthProvider.tsx` wraps the app with `SessionProvider`
- Placeholder image `public/placeholder-item.svg` when `imageUrls` is empty

## Performance Notes

- Indexes exist on FK/uniqueness fields; keyword search uses `contains` (no full-text
  index) — acceptable at MVP scale, revisit with `pg_trgm` or FTS if volume grows
- Pagination on public search and admin lists
- `images.unoptimized` in development only
