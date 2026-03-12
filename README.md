# TO’A FATALONA Admin Dashboard

A production-quality fitness team management system for administering "TO’A FATALONA" blocks. Built with Next.js, Prisma, and PostgreSQL.

## Features

- **Dashboard**: High-level summary of the training block.
- **Teams & Members**: Manage teams and members.
- **Weigh-ins**: Weekly weight logging with auto-calculation of weight loss.
- **KM Logs & Lifestyle**: Weekly activity tracking.
- **Attendance**: Session tracking for Mon/Wed/Fri.
- **Scoreboard**: Automated calculation of weekly awards and points.
- **Scoring Engine**: Implements rules for KM Avg, Weight Loss Total, and Lifestyle Avg (+1 point for winners).
- **PDF/Excel Export**: Export table data and summaries easily.
- **Interactive Analytics**: Trend charts and dynamic dashboard animations.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Styling**: TailwindCSS (with Tongan Cultural Identity Theme)
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

### 6. Testing

To run the unit tests via Vitest:
```bash
npm run test
```

## Folder Structure

- `src/app`: App Router pages and Server Actions (`actions.ts`, `data-actions.ts`, `scoring-actions.ts`).
- `src/components`: Reusable UI (`/ui`) and Layout (`/layout`).
- `src/lib`: Utilities and Prisma client.
- `prisma`: Database schema and seed script.
- `scripts`: Maintenance, testing, or database utility scripts.
- `docs`: Additional documentation and project references.

## Business Rules (Block 1)

- **Dates**: Jan 19, 2026 - Mar 16, 2026 (8 Weeks).
- **Scoring**: Teams (>4 members) compete for +1 point in KM, Weight Loss, Lifestyle.
