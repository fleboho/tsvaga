# Active Context

**Last updated:** 2026-10-21
**Focus:** MVP-1 closeout and handover to the development team

## Current Work Focus

Documentation and repo hygiene so the project can be handed off cleanly.

Completed in this pass:
- Full audit of the repository against the documented state
- `README.md` rewritten with real setup, env, scripts, structure, and known gaps
- `memory-bank/` brought in line with the actual codebase (this file, `progress.md`,
  `techContext.md`, `systemPatterns.md`, `projectbrief.md`)

Audit result: the app builds cleanly (`tsc --noEmit` and `next build` both pass,
21 routes) and all MVP-1 features are implemented — public search, auth, alerts,
admin item/category/location management, mark-returned, and alert matching.

## Recent Changes (code)

1. **Admin locations page** (v0.1.2) — `/admin/locations` with `LocationsAdminClient`,
   backed by `/api/locations` and `/api/locations/[id]`
2. **Mark item returned** — `POST /api/admin/items/[id]/mark-returned` flips status and
   runs alert matching, logging notifications
3. **Optional Google OAuth** — provider registered only when `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET` are present; Prisma adapter already in place
4. **Brand** — favicon and navbar logo (magnifying glass + return arrow)
5. **Search results UI** — horizontal eBay-style cards, 180px thumbnails, bold status labels
6. **Placeholder thumbnail** — `public/placeholder-item.svg` used when an item has no images
7. **Document fields** — items and alerts carry document number, year, issuing authority,
   holder name; advanced search and matching use them

## Open Issues

1. `npm run lint` is broken — Next 16 removed `next lint`; needs `eslint.config.mjs` + `eslint .`
2. No automated tests
3. No Prisma migration history (`/prisma/migrations` gitignored, `db push` only)
4. Item color is matched by alerts but not settable in the admin create form (TODO)
5. Local `/public/uploads` is not durable on Vercel

## Active Decisions

- **Documentation source of truth:** `memory-bank/` + `README.md`; keep them updated
  after each milestone
- **Auth:** NextAuth v4 with JWT strategy and Prisma adapter; role embedded in token
- **Route protection:** per-page/route guards (`lib/auth-utils.ts`), no `middleware.ts`
- **Categories/locations:** alerts and items reference `Category` and `Location` tables (not enums), with
  `customCategory` for free-text "Other"
- **Deletes:** items are archived into `DeletedItem` rather than hard-deleted
- **Email:** console logging only for MVP-1; replace behind the existing notification points later
- **Versioning:** `lib/version.ts`; bump patch freely, minor/major with owner approval

## Next Steps

1. Fix lint tooling
2. Baseline Prisma migrations (`prisma migrate diff` → initial migration)
3. Add minimal tests around auth guards and alert matching
4. Add color to the admin item form
5. Confirm Uploadthing plan/limits for production

## Learnings

- Next 16 passes `params` as a Promise in both pages and route handlers — always `await`
- `next lint` is gone in Next 16; the ESLint CLI is required
- Google OAuth and credentials can coexist with `PrismaAdapter` when sessions stay JWT
- Category/location dropdowns must be seeded before the UI is usable
