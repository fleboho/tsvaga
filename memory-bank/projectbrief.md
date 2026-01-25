# Project Brief

## Project Overview
**Lost & Found MVP-1** is a web application that helps people recover lost items by allowing the public to search for found items, admins to manage found items, and registered users to create alerts for items they've lost.

## Core Requirements (MVP-1 Scope)

### 1. Public Features
- Search found items by keywords
- View detailed information about found items

### 2. Registered User Features
- Create, view, update, and delete personal alerts
- Receive email notifications when items matching their alerts are found (mocked)

### 3. Admin Features
- Create, edit, and delete found items
- Mark items as returned to their owners

### 4. System Features
- Alert matching runs only when a new item is created
- Matching logic:
  - Case-insensitive keyword containment match against item title and description
  - Category must match exactly if alert category is set
  - Location must match exactly if alert location is set
- Contact Admin form on item detail page (sends mock email via console.log)

## Technology Stack (Mandatory)
- **Framework:** Next.js (App Router)
- **Backend:** Next.js Route Handlers under `/app/api`
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** Auth.js (NextAuth) — Credentials provider only
- **Email:** Mock only using `console.log`

## User Roles & Permissions
- **Public (Unauthenticated):** Search items, view item details
- **Registered User:** Manage their own alerts, receive notifications
- **Admin:** Manage all found items, mark items as returned

## Explicitly Out of Scope (DO NOT IMPLEMENT)
- SMS notifications
- WhatsApp notifications
- Maps or GPS functionality
- AI features or image comparison
- User-posted found items
- Bulk import/export
- Mobile applications
- Analytics dashboards
- Success stories
- Payments or monetization
- GDPR compliance workflows
- Social login providers

## Project Goals
1. Create a functional MVP-1 that demonstrates core lost & found workflow
2. Establish clean architecture following the mandatory technology stack
3. Provide clear separation of concerns between public, user, and admin functionality
4. Implement mock email notifications that can be replaced with real email service later

## Success Criteria
- Public users can search and view found items
- Registered users can create and manage alerts
- Admins can manage the found items catalog
- Alert matching works according to specified rules
- Contact form sends mock emails
- All features work within the defined technology stack