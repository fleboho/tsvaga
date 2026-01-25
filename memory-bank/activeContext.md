# Active Context

## Current Work Focus
**Project Initialization Phase**
- Setting up the memory bank documentation
- Establishing project structure and foundational files
- No code has been written yet - this is the documentation phase

## Recent Changes
1. **Memory Bank Created** (2025-01-24)
   - Created memory-bank directory
   - Created projectbrief.md with MVP-1 scope and requirements
   - Created productContext.md with user experience and business context

## Next Steps (Immediate)
1. Complete memory bank initialization:
   - Create remaining core files (systemPatterns.md, techContext.md, progress.md)
2. Project setup:
   - Initialize Next.js project with TypeScript
   - Set up PostgreSQL database
   - Configure Prisma ORM
   - Set up Auth.js (NextAuth) with credentials provider
3. Implement core database schema:
   - Define User, Item, Alert models
   - Set up relationships and constraints

## Active Decisions & Considerations

### Architecture Decisions
1. **Next.js App Router**: Using the new App Router for better performance and simplicity
2. **Route Handlers**: API routes will be under `/app/api` for consistency with App Router
3. **Database Schema**: Need to design tables for:
   - Users (with role: user/admin)
   - Items (found items with status)
   - Alerts (user search criteria)
   - Notifications (record of sent alerts)

### Implementation Priorities
1. **Authentication First**: Set up Auth.js to enable user roles early
2. **Database Schema**: Define core models before building UI
3. **Admin Features**: Since only admins can create items, need admin authentication early
4. **Public Search**: Basic search functionality for MVP demonstration

### Important Patterns & Preferences
1. **TypeScript Strict**: Use strict TypeScript configuration
2. **Prisma Best Practices**: Use Prisma client with proper error handling
3. **Next.js Conventions**: Follow Next.js 14+ best practices
4. **Component Structure**: Use consistent component organization

## Learnings & Project Insights
1. **Scope Clarity**: The .clinerules provide very clear boundaries for MVP-1
2. **Technology Constraints**: Mandatory stack eliminates decision paralysis
3. **User Role Separation**: Clear distinction between public, user, and admin roles
4. **Mock Email Requirement**: Email functionality is mocked via console.log for MVP-1

## Questions & Uncertainties
1. **Email Mocking Details**: Need to determine exact format for mock email logs
2. **Alert Matching Frequency**: Confirmed to run only on new item creation
3. **Category/Location Management**: Need to decide if these are enums or free text
4. **Admin Creation**: How are initial admin accounts created?

## Current Status
- **Phase**: Documentation & Planning
- **Code Written**: 0%
- **Database Setup**: 0%
- **Authentication**: 0%
- **UI Components**: 0%

## Key Dependencies
1. Node.js environment
2. PostgreSQL database
3. Next.js 14+
4. Prisma CLI
5. Auth.js packages