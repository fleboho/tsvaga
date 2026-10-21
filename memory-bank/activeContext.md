# Active Context

**Last updated:** 2026-10-21
**Focus:** Production hardening complete; deploy pre-flight remaining

## Current Work Focus

Production hardening (2026-10-21). Implemented:
- Email delivery (`lib/email.ts`, Resend + console fallback) wired into contact and alerts
- Contact requests persisted in `ContactRequest` before sending
- Postgres rate limiting on contact, register, and login
- Prisma migrations (baseline + new tables), `prisma:deploy` script
- `admin:create` bootstrap script (creates or promotes without wiping data)
- Security headers/CSP, restricted image hosts, error boundaries
- Uploadthing cleanup on item delete; item archive now keeps colour and images
- Colour captured in admin create/edit forms and enforced by matching
- Lint fixed (flat config), 15 unit tests, `type-check`, GitHub Actions CI

Verification: `tsc --noEmit` ✅, `npm run lint` ✅ 0 errors, `npm test` ✅ 15/15,
`next build` ✅ 21 routes.

Remaining before launch: configure Resend + sender domain, apply the migration baseline
to the live database, create the production admin, smoke-test contact and alert emails,
and choose an error-tracking service.

## Recent Changes (code)

0. **Production hardening** — see Current Work Focus

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

1. Resend is implemented but not configured (no sender domain/API key yet)
2. Contact requests have no admin UI
3. No password reset or email verification
4. No error-tracking service
5. Rate limiter fails open when Postgres is unreachable

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

1. Configure Resend and verify the sender domain
2. Apply the migration baseline to the live Neon database, then `prisma:deploy`
3. Create the production admin via `admin:create`
4. Smoke-test contact form + alert notifications end to end
5. Choose error tracking and add contact-request visibility to the admin dashboard

## Learnings

- Next 16 passes `params` as a Promise in both pages and route handlers — always `await`
- `next lint` is gone in Next 16; use ESLint 9 with `eslint-config-next/core-web-vitals`
  (it exports a flat config array)
- `eslint-config-next` 16 enables React Compiler rules; `react-hooks/set-state-in-effect`
  is disabled because effect-based fetching is used in the admin/dashboard clients
- Google OAuth and credentials can coexist with `PrismaAdapter` when sessions stay JWT
- Prisma `migrate dev` needs a shadow database — generate SQL with `migrate diff` instead
  when no local Postgres is available
