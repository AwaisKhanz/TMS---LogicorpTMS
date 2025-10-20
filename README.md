# TMS - Transportation Management System

Multi-tenant SaaS platform for freight brokers and logistics companies.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, shadcn/ui, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT + NextAuth.js
- **Monorepo**: Turborepo

## Quick Start

```bash
# Install dependencies
npm install

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development
npm run dev
```

## Environment Setup

### Backend (`apps/api/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/tms
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:3000
```

### Database (`packages/database/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/tms
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

## Project Structure

```
├── apps/
│   ├── api/          # Express backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── database/     # Prisma schema & client
│   ├── typescript-config/
│   └── eslint-config/
└── docs/             # Complete documentation
```

## Commands

```bash
# Development
npm run dev          # Start all apps
npm run build        # Build all apps
npm run lint         # Lint all apps

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## Documentation

See `docs/` folder for complete documentation:

- Requirements & Architecture
- Database Design
- API Documentation
- Implementation Plan

## Phase 1 Status

✅ Complete - All core features implemented and tested.

For detailed review, see `MONOREPO_REVIEW_COMPLETE.md`.
