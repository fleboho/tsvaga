# System Patterns

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │◄──►│   API Routes    │◄──►│   PostgreSQL    │
│   (App Router)  │    │  (/app/api/*)   │    │    Database     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │    │  Route Handlers │    │   Prisma ORM    │
│   (React/TSX)   │    │  (TypeScript)   │    │   (Schema)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components
1. **Frontend Layer**: Next.js pages and components
2. **API Layer**: Route handlers for business logic
3. **Data Layer**: Prisma ORM with PostgreSQL
4. **Auth Layer**: Auth.js for authentication and authorization

## Key Technical Decisions

### 1. Authentication & Authorization
- **Library**: Auth.js (NextAuth) v5+
- **Provider**: Credentials only (no social providers)
- **Session Strategy**: JWT for simplicity
- **Role Management**: User role stored in database (user/admin)

### 2. Database Schema Patterns
```prisma
// Core entities:
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // hashed
  role      Role     @default(USER)
  alerts    Alert[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Item {
  id          String   @id @default(cuid())
  title       String
  description String
  category    String?
  location    String?
  status      ItemStatus @default(AVAILABLE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdById String?
}

model Alert {
  id          String   @id @default(cuid())
  keywords    String
  category    String?
  location    String?
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}

enum ItemStatus {
  AVAILABLE
  RETURNED
}
```

### 3. API Design Patterns
- **RESTful conventions** with Next.js Route Handlers
- **Error Handling**: Consistent error responses with status codes
- **Validation**: Zod for request validation
- **Authentication**: Protected routes using NextAuth middleware

### 4. Alert Matching Algorithm
```typescript
// Pseudocode for alert matching
function findMatchingAlerts(newItem: Item) {
  const alerts = await prisma.alert.findMany({
    where: {
      AND: [
        // Keyword match (case-insensitive, contains)
        {
          OR: [
            { keywords: { contains: newItem.title, mode: 'insensitive' } },
            { keywords: { contains: newItem.description, mode: 'insensitive' } }
          ]
        },
        // Category match (if alert has category)
        ...(newItem.category ? [{ category: newItem.category }] : []),
        // Location match (if alert has location)
        ...(newItem.location ? [{ location: newItem.location }] : [])
      ]
    },
    include: { user: true }
  });
  
  return alerts;
}
```

## Component Relationships

### Page Structure
```
/app
  /api
    /auth/[...nextauth]    # Auth.js routes
    /items                 # Item management
    /alerts                # Alert management
    /notifications         # Notification sending
  /(public)                # Public pages (no auth required)
    /search                # Search page
    /items/[id]            # Item detail page
  /(auth)                  # Authenticated pages
    /dashboard             # User dashboard
    /alerts                # User alert management
  /admin                   # Admin pages (admin role required)
    /items                 # Admin item management
  layout.tsx               # Root layout with auth provider
```

### Key Component Dependencies
1. **AuthProvider**: Wraps entire app, provides session context
2. **Navbar**: Changes based on user role (public/user/admin)
3. **SearchComponent**: Used on public search page
4. **ItemCard**: Reusable component for displaying items
5. **AlertForm**: Used by users to create/edit alerts
6. **ItemForm**: Used by admins to create/edit items

## Critical Implementation Paths

### 1. User Registration & Login Flow
```
User submits credentials → Auth.js validates → Create session → Redirect to dashboard
```

### 2. Item Creation Flow (Admin)
```
Admin logs in → Navigates to /admin/items → Fills form → Submits → 
API creates item → Trigger alert matching → Send notifications → Return success
```

### 3. Alert Creation Flow (User)
```
User logs in → Navigates to /alerts → Fills form → Submits → 
API creates alert → Return success
```

### 4. Search Flow (Public)
```
User visits /search → Enters keywords → API searches items → 
Display results → Click item → View details → Contact admin
```

## Data Flow Patterns

### 1. Authentication Flow
```
Client → NextAuth → Database → Session → Protected Route
```

### 2. CRUD Operations
```
Component → API Route → Prisma Client → Database → Response
```

### 3. Notification Flow
```
New Item → Alert Matching → Find Users → Mock Email (console.log) → Record Notification
```

## Performance Considerations
1. **Database Indexing**: Index on Item(title, description), Alert(keywords, category, location)
2. **Caching**: Consider React Cache for frequently accessed data
3. **Pagination**: Implement for search results and admin lists
4. **Optimistic Updates**: For better UX in forms

## Security Patterns
1. **Input Validation**: Zod schemas for all API inputs
2. **SQL Injection Prevention**: Prisma parameterized queries
3. **XSS Protection**: React's built-in escaping, sanitize user input
4. **CSRF Protection**: NextAuth provides CSRF tokens
5. **Role-Based Access**: Middleware checks user role for admin routes