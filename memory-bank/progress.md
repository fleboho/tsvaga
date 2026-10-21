# Progress

**Last updated:** 2026-10-21
**App version:** 0.1.2
**MVP-1 status:** Feature complete, in closeout/handover

## Verification Snapshot (2026-10-21)

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx next build` | ✅ compiles, 21 routes generated |
| `npm run lint` | ❌ broken — `next lint` removed in Next 16 |
| Automated tests | ❌ none configured |
| Git state | `main` clean, in sync with `origin/main` |

## What Works

### Public features ✅
- Home page with search entry point
- `/search`: keyword + category + location filtering, pagination, item cards
- `/search/advanced`: document-aware search
- `/items/[id]`: gallery, metadata, status badge, contact-admin form
- Contact form validates input and logs a mock email to the console

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

## Known Gaps

1. **Lint script broken** — `next lint` no longer exists in Next 16; `.eslintrc.json`
   is legacy format for ESLint 9. Needs flat config + `eslint .`
2. **No tests** — no runner, no unit/integration/e2e coverage
3. **No migration history** — `/prisma/migrations` is gitignored; schema is applied
   with `prisma db push`. Blocks safe staged/production rollouts
4. **Color not exposed in admin item form** — TODO in `app/api/admin/items/route.ts`
5. **Uploads require Uploadthing** — images go through `utapi` (`lib/file-upload.ts`);
   without `UPLOADTHING_TOKEN` admin image uploads fail. Legacy `/public/uploads` config remains
6. **Real email** — intentionally out of scope for MVP-1

## Progress by Area

| Area | Status |
| --- | --- |
| Infrastructure & tooling | 90% (lint/tests/migrations open) |
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

## Next Steps (closeout)

1. Fix `npm run lint` (flat ESLint config)
2. Introduce Prisma migrations and baseline the current schema
3. Add a minimal test suite (auth guards, alert matching, search filters)
4. Expose color in the admin item create form
5. Confirm Uploadthing plan/limits and document production image handling

## Success Criteria

- [x] Public users can search and view found items
- [x] Registered users can create and manage alerts
- [x] Admins can manage the found items catalog
- [x] Alert matching works per the documented rules
- [x] Contact form sends mock emails
- [x] All features run on the mandated stack
