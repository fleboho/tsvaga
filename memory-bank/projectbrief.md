# Project Brief

**Last updated:** 2026-10-21
**Version:** 0.1.2 (MVP-1)

## Overview

**Tsvaga** is a lost & found web application. The public searches a catalog of found
items, registered users create alerts and are notified by email when a matching item
is logged, and admins maintain the catalog, categories, and locations.

## MVP-1 Scope (as built)

### 1. Public (no auth)
- Keyword search with category and location filters and pagination
- Advanced document search (document number, year, issuing authority, holder name)
- Item detail page with image gallery
- Contact-admin form that stores the request and emails the admin

### 2. Registered users
- Register and sign in (credentials; Google optional)
- User dashboard with alert statistics
- Create, list, edit, and delete personal alerts (owner-scoped)
- Alerts support keywords, category, location, color, and document fields

### 3. Admin
- Admin dashboard
- Create, edit, delete items; upload and remove item images
- Mark items returned (triggers matching)
- Manage categories
- Manage locations

### 4. System
- Alert matching on new item creation and on mark-returned:
  1. All keywords present in title + description (case-insensitive)
  2. Category matches if the alert sets one
  3. Location matches if the alert sets one
  4. Document fields match for document alerts
  5. Color matches if the alert sets one
- Mock notification output only
- Items are archived to `DeletedItem` on delete

## Technology Stack (mandatory)

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Backend:** Next.js Route Handlers under `app/api`
- **Database:** PostgreSQL
- **ORM:** Prisma 6
- **Auth:** NextAuth v4 — credentials provider, plus optional Google OAuth
- **UI:** React 19, Tailwind CSS 4
- **Validation:** Zod 4
- **Uploads:** Uploadthing for images
- **Email:** Resend REST API; structured console fallback when unconfigured

## Roles & Permissions

| Role | Capabilities |
| --- | --- |
| Public | Search, view item details, contact admin |
| `USER` | Everything public + dashboard, own alert CRUD |
| `ADMIN` | Everything a user can do + item/category/location management, mark returned |

## Out of Scope (do not implement in MVP-1)

- SMS or WhatsApp notifications
- Maps, GPS, or geolocation features
- AI features or image comparison
- Public/user-submitted found items (admins only in MVP-1)
- Bulk import/export
- Native mobile applications
- Analytics dashboards
- Success stories
- Payments or monetization
- GDPR compliance workflows
- Real email delivery beyond the single Resend integration
- Additional social login providers beyond the optional Google integration

## Goals

1. Demonstrate the core lost & found workflow end to end
2. Keep a clean separation between public, user, and admin concerns
3. Keep notifications behind a single replaceable point (console → real provider later)
4. Hand over a codebase that builds cleanly and is ready for a development team

## Success Criteria

- [x] Public users can search and view found items
- [x] Registered users can create and manage alerts
- [x] Admins can manage the catalog, categories, and locations
- [x] Alert matching follows the documented rules
- [x] Contact form stores and emails enquiries
- [x] Everything runs on the mandated stack
- [x] Production build passes (`next build`, `tsc --noEmit`)
