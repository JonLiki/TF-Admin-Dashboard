# TO’A FATALONA Admin Dashboard

A production-quality fitness team management system for administering "TO’A FATALONA" blocks. Built with Next.js, Prisma, and PostgreSQL.

## Features

- **Dashboard**: High-level summary of the training block.
- **Teams & Members**: Manage teams (Va’a) and members (Kainga).
- **Weigh-ins**: Weekly weight logging with auto-calculation of weight loss.
- **KM Logs & Lifestyle**: Weekly activity tracking.
- **Attendance**: Session tracking (Ha’u) for Mon/Wed/Fri.
- **Scoreboard**: Automated calculation of weekly awards and points.
- **Scoring Engine**: Implements rules for KM Avg, Weight Loss Total, and Lifestyle Avg (+1 point for winners).

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Styling**: TailwindCSS (with Tongan Cultural Identity Theme)

## Getting Started

### 1. Prerequisites

- Node.js (v18+)
- PostgreSQL (Local or Remote)

### 2. Environment Setup

Copy `.env` to configure your database connection:

```bash
# Update with your PostgreSQL credentials
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/tf_dashboard?schema=public"
```

**Note**: If you receive authentication errors, ensure your local Postgres server is running and the credentials in `.env` match your configuration.

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

## Folder Structure

- `src/app`: App Router pages and Server Actions (`actions.ts`, `data-actions.ts`, `scoring-actions.ts`).
- `src/components`: Reusable UI (`/ui`) and Layout (`/layout`).
- `src/lib`: Utilities and Prisma client.
- `prisma`: Database schema and seed script.

## Business Rules (Block 1)

- **Dates**: Jan 19, 2026 - Mar 16, 2026 (8 Weeks).
- **Scoring**: Teams (>4 members) compete for +1 point in KM, Weight Loss, Lifestyle.
