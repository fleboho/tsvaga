# Tech Context

**Last updated:** 2026-10-21

## Stack (as installed)

| Concern | Choice | Version |
| --- | --- | --- |
| Framework | Next.js (App Router) | 16.1 |
| Language | TypeScript (strict) | 5.9 |
| UI | React / React DOM | 19.2 |
| Styling | Tailwind CSS + PostCSS + Autoprefixer | 4.1 |
| Database | PostgreSQL | 15+ |
| ORM | Prisma Client / Prisma CLI | 6.19 |
| Auth | next-auth + @auth/prisma-adapter | 4.24 / 2.11 |
| Hashing | bcryptjs | 3.0 |
| Validation | Zod | 4.3 |
| Uploads | uploadthing / @uploadthing/react | 7.7 |
| Icons | lucide-react | 0.563 |
| UI primitives | @radix-ui/react-select, clsx, tailwind-merge, class-variance-authority | — |
| Lint | eslint + eslint-config-next | 9.39 / 16.1 |
| Scripts | tsx (for `prisma/seed.ts`) | 4.21 |

Runtime used in development: Node 22 (WSL2).

## Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or a hosted equivalent: Neon, Railway, Supabase)

### Steps

```bash
npm install                 # postinstall runs `prisma generate`
cp .env.example .env        # then fill in values
npx prisma db push          # create/update schema
npm run prisma:seed         # optional sample data
npm run dev                 # http://localhost:3000
```

### Environment Variables

```env
# Required
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
UPLOADTHING_TOKEN="ey..."          # full token, not the API key

# Optional (both or neither) — enables Google sign-in
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

`.env` is gitignored; only `.env.example` is tracked. Next.js loads `.env`
directly (`.env.local` also works if preferred).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | **Broken on Next 16** (see Constraints) |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:push` | Push schema without migrations |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `npm run prisma:studio` | Prisma Studio |
| `npm run prisma:seed` | Run `prisma/seed.ts` |

## Project Structure (actual)

```
app/
  api/
    admin/items/…           admin item CRUD, images, mark-returned
    alerts/                 user alert CRUD
    auth/[...nextauth]/     NextAuth handler
    auth/register/          credentials registration
    categories/             category CRUD
    contact/                mock contact email
    items/                  public search, detail, filters
    locations/              location CRUD
  admin/                    dashboard, items, items/[id]/edit, categories, locations
  alerts/                   user alert management
  dashboard/                user dashboard
  items/[id]/               public item detail
  login/, register/         auth pages
  search/                   search, advanced, ItemCard, Pagination, forms
components/                 Navbar, AlertForm, ContactForm, AuthProvider, ui/
lib/                        auth.ts, auth-utils.ts, db.ts, alert-schemas.ts,
                            file-upload.ts, uploadthing.ts, utils.ts, version.ts
prisma/                     schema.prisma, seed.ts
public/                     static assets, uploads/
memory-bank/                project documentation
```

## Constraints & Conventions

### Auth
- NextAuth **v4** (not v5). Options live in `lib/auth.ts`, exported as `authOptions`
- JWT session strategy with `id` and `role` on the token/session
- Prisma adapter backs `Account`/`Session`/`VerificationToken` for Google OAuth
- Credentials provider validates with Zod + bcrypt
- No social provider is configured unless the Google env vars exist

### Authorization
- `requireAuth()` → redirects to `/login`
- `requireAdmin()` → redirects to `/dashboard?error=admin_required` (pages) or returns a
  403 descriptor (`returnJson = true`)
- `checkAdminAccess()` → returns a `Response` or `null` for API routes
- No `middleware.ts`; each protected page/route enforces access itself

### Database
- PostgreSQL + Prisma only
- Schema changes in development use `prisma db push`
- `/prisma/migrations` is gitignored — **no migration history yet**
- Deletes of items archive to `DeletedItem` before removal

### API
- All handlers under `app/api/*` (route handlers, TypeScript)
- Inputs validated with Zod; consistent `{ error }` JSON + status codes
- Next 16: dynamic `params` are Promises and must be awaited

### Email
- Mock only — `console.log` blocks with to/subject/message
- Replace at the notification points (`admin/items` create, `mark-returned`, `contact`)

### Images
- Item images upload to Uploadthing via `lib/uploadthing.ts` (`UTApi`) and
  `lib/file-upload.ts` (4MB limit; jpeg/png/webp)
- `imageUrls` stores the returned remote URLs
- Legacy `/public/uploads` handling remains in `.gitignore` and `next.config.js`
  (`images.unoptimized` in development)

## Known Tooling Issues

1. `npm run lint` → `Invalid project directory … /lint`. `next lint` was removed in
   Next 16. Fix: install/keep ESLint 9, add `eslint.config.mjs` (flat config, extending
   `next/core-web-vitals`), change the script to `eslint .`
2. `.eslintrc.json` is the legacy config format; migrate when adding the flat config
3. No test runner is installed
4. `next-env.d.ts` and `*.tsbuildinfo` are gitignored (correct)

## Git Workflow

- Branches: `feature/`, `bugfix/`, `hotfix/`
- Conventional commit messages
- `main` is the integration branch; `develop` was merged into it
- Version lives in `lib/version.ts`; patch bumps at will, minor/major with owner sign-off
