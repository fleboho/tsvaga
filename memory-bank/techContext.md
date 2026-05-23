# Tech Context

## Technologies Used

### Core Stack (Mandatory)
1. **Next.js 14+** (App Router)
   - Framework for full-stack React application
   - App Router for routing and layout
   - Server Components and Server Actions
   - Built-in API routes

2. **TypeScript**
   - Strict type checking enabled
   - Type-safe API responses and database queries
   - Better developer experience and code quality

3. **PostgreSQL**
   - Relational database for structured data
   - ACID compliance for data integrity
   - Suitable for user, item, and alert relationships

4. **Prisma ORM**
   - Type-safe database client
   - Schema migrations
   - Query builder with TypeScript support

5. **Auth.js (NextAuth)**
   - Authentication library for Next.js
   - Credentials provider only (no social providers)
   - Session management with JWT
   - Role-based access control

### Development Tools
1. **Node.js** (Latest LTS version)
2. **npm** or **yarn** for package management
3. **Git** for version control
4. **VS Code** as primary IDE

### Key Dependencies
```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "typescript": "^5.x",
    "@prisma/client": "^5.x",
    "@auth/prisma-adapter": "^1.x",
    "next-auth": "^5.x",
    "zod": "^3.x",
    "bcryptjs": "^2.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "tailwindcss": "^3.x", // Optional but recommended
    "autoprefixer": "^10.x",
    "postcss": "^8.x"
  }
}
```

## Development Setup

### Prerequisites
1. **Node.js** 18.17 or later
2. **PostgreSQL** 15 or later
3. **Git** for version control

### Initial Setup Steps
```bash
# 1. Clone repository (if applicable)
git clone <repository-url>
cd tsvaga-03

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database URL and auth secret

# 4. Set up database
npx prisma db push
# or for production: npx prisma migrate dev

# 5. Run development server
npm run dev
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lostandfound"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Email configuration (mocked for MVP-1)
EMAIL_FROM="noreply@lostandfound.example.com"
```

### Project Structure
```
tsvaga-03/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Auth.js routes
│   │   ├── items/         # Item management
│   │   └── alerts/        # Alert management
│   ├── (public)/          # Public pages
│   ├── (auth)/            # Authenticated pages
│   ├── admin/             # Admin pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
├── lib/                   # Utility functions
│   ├── auth.ts           # Auth configuration
│   ├── db.ts             # Database client
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema
├── public/               # Static assets
├── memory-bank/          # Project documentation
└── package.json
```

## Technical Constraints

### 1. Authentication Constraints
- Only credentials provider allowed (email/password)
- No social login providers (Google, GitHub, etc.)
- Must use Auth.js v5+
- Role-based access control required

### 2. Database Constraints
- Must use PostgreSQL
- Must use Prisma ORM
- Schema must support relationships between User, Item, Alert
- Must include proper indexes for search performance

### 3. API Constraints
- All API routes must be under `/app/api`
- Must use TypeScript for type safety
- Must validate inputs with Zod
- Must handle errors consistently

### 4. Email Constraints
- Email functionality must be mocked using `console.log`
- No real email service integration in MVP-1
- Must log email details for debugging

## Tool Usage Patterns

### Prisma Workflow
```bash
# 1. Edit schema
code prisma/schema.prisma

# 2. Generate client
npx prisma generate

# 3. Apply changes to database
npx prisma db push
# or for migrations: npx prisma migrate dev

# 4. Open Prisma Studio (optional)
npx prisma studio
```

### Development Workflow
```bash
# Start development server
npm run dev

# Run TypeScript compiler
npm run type-check

# Run linting (if configured)
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Testing Patterns
```bash
# Unit tests (if configured)
npm test

# Integration tests (if configured)
npm run test:integration

# E2E tests (if configured)
npm run test:e2e
```

## Development Guidelines

### Code Style
1. **TypeScript**: Use strict mode, avoid `any` type
2. **Imports**: Use absolute imports when possible
3. **Components**: Use functional components with TypeScript
4. **Error Handling**: Use try-catch blocks in API routes
5. **Validation**: Validate all user inputs with Zod

### Git Workflow
1. **Branch Naming**: `feature/`, `bugfix/`, `hotfix/`
2. **Commit Messages**: Conventional commits
3. **Pull Requests**: Code review required
4. **Main Branch Protection**: Enabled

### Performance Considerations
1. **Database**: Use indexes for frequently queried fields
2. **API**: Implement pagination for large datasets
3. **Frontend**: Use React.memo for expensive components
4. **Images**: Use Next.js Image component for optimization

## Troubleshooting Common Issues

### Database Connection
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Connect to database
psql -U postgres -d lostandfound

# Reset database (development only)
npx prisma db reset
```

### Authentication Issues
1. **Session not persisting**: Check NEXTAUTH_SECRET and NEXTAUTH_URL
2. **Credentials not working**: Verify password hashing
3. **Role not recognized**: Check database role field

### Build Issues
1. **TypeScript errors**: Run `npm run type-check`
2. **Prisma client missing**: Run `npx prisma generate`
3. **Environment variables**: Ensure `.env.local` is properly configured