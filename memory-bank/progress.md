# Progress

**Last updated:** 2026-10-21
**App version:** 0.1.2
**MVP-1 status:** Feature complete; production hardening applied

## Verification Snapshot (2026-10-21)

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx next build` | ✅ compiles, 21 routes generated |
| `npm run lint` | ✅ 0 errors (3 `<img>` warnings) |
| `npm test` | ✅ 15 tests pass (alert matching, rate-limit helpers) |
| Git state | `main` clean, in sync with `origin/main` |

## What Works

### Public features ✅
- Home page with search entry point
- `/search`: keyword + category + location filtering, pagination, item cards
- `/search/advanced`: document-aware search
- `/items/[id]`: gallery, metadata, status badge, contact-admin form
- Contact form validates input, persists the request, and emails the admin

### Authentication ✅
- Credentials registration (`/api/auth/register`) with bcrypt hashing
- Credentials login (`/login`) and Google OAuth (enabled only when
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set)
- JWT sessions with `id` and `role` claims; Prisma adapter + `Account`/`Session` tables
- Role-based guards: `requireAuth()`, `requireAdmin()`, `checkAdminAccess()`

### User features ✅
- `/dashboard` with live alert statistics
- `/alerts` full CRUD, user isolation enforced in API routes
- Alerts support category/location, document fields, and color

### Admin features ✅
- `/admin/dashboard` with summary stats
- `/admin/items`: modal create, search/filter, edit, delete, image upload/removal
- `/admin/items/[id]/edit`
- Mark item as returned → moves item to `RETURNED` and runs alert matching
- `/admin/categories`: category CRUD
- `/admin/locations`: location CRUD

### Alert matching ✅
- Runs on admin item creation and on mark-returned
- Keyword AND-match against title + description, then optional exact category,
  location, document fields, and color
- Notifications are `console.log` only (MVP-1 requirement)

## Data Model (actual)

`User`, `Account`, `Session`, `VerificationToken`, `Item`, `DeletedItem`,
`Alert`, `Category`, `Location`; enums `Role` (USER/ADMIN) and `ItemStatus`
(AVAILABLE/RETURNED). Categories and locations are first-class tables, not enums.

## Production Hardening (2026-10-21)

- **Email** — `lib/email.ts` sends via Resend when configured, console fallback otherwise.
  Wired into contact form, new-item matches, and mark-returned notifications
- **Contact requests** — persisted to `ContactRequest` before email, so enquiries survive
  delivery failures
- **Rate limiting** — Postgres fixed-window limiter (`lib/rate-limit.ts`): contact 5/10min,
  register 5/hour, login 10/15min per IP+email
- **Migrations** — baseline + `contact_requests_rate_limit` migrations committed;
  `prisma migrate deploy` script added
- **Admin bootstrap** — `npm run admin:create -- <email>` creates or promotes an admin
  without wiping data
- **Security** — CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy;
  `images.remotePatterns` restricted to Uploadthing hosts; `poweredByHeader` off
- **Error handling** — `app/error.tsx` and `app/global-error.tsx`
- **Storage hygiene** — item deletion archives images and removes Uploadthing files
- **Tooling** — flat ESLint config, `npm run lint` fixed, `npm test` with 15 tests,
  `npm run type-check`, GitHub Actions CI
- **Colour** — now captured in admin create/edit forms and enforced in matching

## Known Gaps

1. **No error-tracking service** — errors only reach platform logs
2. **No admin UI for contact requests** — stored but readable only in the database
3. **No password reset / email verification**
4. **Uploads require Uploadthing** — without `UPLOADTHING_TOKEN` image uploads fail
5. **Rate limiter fails open** — if Postgres is unreachable, requests are allowed
6. **Production email untested against Resend** — needs a verified sender domain and a live key

## Progress by Area

| Area | Status |
| --- | --- |
| Infrastructure & tooling | 95% (CI, lint, tests, migrations in place) |
| Database & schema | 100% |
| Authentication & RBAC | 100% |
| Public features | 100% |
| User features | 100% |
| Admin features | 100% |
| Alert matching | 100% (console notifications) |
| Documentation | 100% (aligned 2026-10-21) |

## History of Decisions

- **2025-01-24** — Project initialized; memory-bank structure created; MVP-1 scope fixed
- **2025-01-25** — Public features implemented and verified; Next 16 `params`-as-Promise fixed;
  uploads excluded from git
- **2025-01-27** — Full alert CRUD + `/alerts` UI; dashboard stats; home search location
  changed from dropdown to free text; admin items page gained modal create + search
- **2025-01-28** — Navbar restructured (public left, account right)
- **2026-10 (0.1.1–0.1.2)** — Favicon/brand logo, placeholder item thumbnail, eBay-style
  horizontal search cards with enlarged thumbnails, duplicate header fix, Google OAuth
  (optional), admin locations page, mark-returned with alert matching
- **2026-10-21** — Documentation aligned with actual codebase; closeout audit performed

## Next Steps

1. Configure Resend (verified domain, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`)
2. Run the production pre-flight: `migrate resolve --applied <baseline>`, `prisma:deploy`,
   `admin:create`, smoke-test contact + alert notifications
3. Decide on error tracking (Sentry or similar)
4. Add contact-request visibility to the admin dashboard
5. Plan password reset and email verification for MVP-2

## Success Criteria

- [x] Public users can search and view found items
- [x] Registered users can create and manage alerts
- [x] Admins can manage the found items catalog
- [x] Alert matching works per the documented rules
- [x] Contact form delivers enquiries to the admin inbox
- [x] All features run on the mandated stack
