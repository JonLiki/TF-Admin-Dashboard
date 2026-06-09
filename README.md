# TO’A FATALONA Admin Dashboard

A production-quality fitness team management system for administering "TO’A FATALONA" blocks. Built with Next.js 16, React 19, Prisma, PostgreSQL, and Tailwind CSS v4 featuring a premium Tongan Cultural Identity theme.

## Features

- **Dashboard**: High-level summary of the training block with Mission Control visuals.
- **Teams & Groups**: Manage groups and assign participants.
- **Weigh-ins**: Weight logging with auto-calculation of weekly delta weight loss.
- **KM Logs & Lifestyle**: Weekly activity tracking.
- **Attendance**: Session tracking for Mon/Wed/Fri.
- **Scoreboard**: Automated calculation of weekly awards and points.
- **Scoring Engine**: Implements rules for KM Avg, Weight Loss Total, and Lifestyle Avg (+1 point for winners).
- **PDF/Excel Export**: Export table data and summaries easily.
- **Interactive Analytics**: Premium trend charts (Recharts) and dynamic dashboard animations (Framer Motion).

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19 (React Compiler enabled)
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Styling**: Tailwind CSS v4 (featuring an advanced Tongan Cultural Identity theme with ambient background atmospheres and glassmorphism layouts)
- **Authentication**: NextAuth (v5 / auth.js)
- **Testing**: Vitest
- **Data Visualization**: Recharts, Framer Motion, React Spring

## Getting Started

### 1. Prerequisites

- Node.js (v18+)
- PostgreSQL (Local or Remote)

### 2. Environment Setup

Copy `.env` to configure your database connection and authentication variables:

```bash
# Update with your PostgreSQL credentials
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/tf_dashboard?schema=public"

# NextAuth Configuration
AUTH_SECRET="your_secure_random_string_here"
```

**Note**: If you receive authentication errors, ensure your local Postgres server is running and the credentials in `.env` match your configuration. If using NextAuth, make sure you generated a strong `AUTH_SECRET`.

### 3. Installation

```bash
npm install
```

### 4. Database Setup

Create the database and seed initial data (Block 1, Sessions):

```bash
npx prisma db push
npx prisma db seed
```

### 5. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 6. Testing & Quality Checks

To run the unit tests via Vitest:
```bash
npm run test
```

To run lint checks via ESLint:
```bash
npm run lint
```
*Note: The codebase has been fully audited and cleaned up. It builds and lints with 0 errors and 0 warnings.*

## Folder Structure

- `src/app`: App Router pages and page-level entry layouts.
- `src/actions`: Server Actions for all data mutations (blocks, imports, exports, auth, scoring) grouped by function.
- `src/components`: UI components organized by feature (dashboard, scoreboard, members, teams, benchmarks, layout, ui).
- `src/lib`: Core utility scripts and helper functions:
  - `src/lib/scoring-logic.ts`: Pure business logic for metric calculations and winner determination.
  - `src/lib/queries.ts`: Read-only queries separated from mutations for static analysis and performance.
- `prisma`: Database schema and seed script.
- `scripts`: Utility scripts for spreadsheet pre-processing and data backfills.
- `docs`: Additional documentation and project references.

## Business Rules (Block 1)

- **Dates**: Jan 19, 2026 - Mar 16, 2026 (8 Weeks).
- **Scoring**: Teams with 4 or more members compete for +1 point per weekly category: KM Average, Weight Loss, Lifestyle Average, and Attendance Average. Ties award a point to every tied team.
- **Weeks**: Run Monday through Sunday (stored as UTC-midnight dates). Weigh-ins happen on Mondays; a week's weight loss compares its Monday weigh-in to the next Monday's, and the final weigh-in falls on the Monday after the block ends.
