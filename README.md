# TO'A FATALONA Admin Dashboard

A production-quality fitness team management system for administering "TO'A FATALONA" training blocks. Built with Next.js 16, React 19, Prisma, PostgreSQL, and Tailwind CSS v4, featuring a premium Tongan Cultural Identity theme.

## Features

- **Dashboard**: High-level summary of the active training block with Mission Control visuals and animated metrics.
- **Teams & Groups**: Manage groups and assign participants.
- **Weigh-ins**: Weight logging with auto-calculation of weekly delta weight loss.
- **KM Logs & Lifestyle**: Weekly activity and social post tracking.
- **Attendance**: Session tracking for Mon/Wed/Fri with per-team averages.
- **Benchmarks**: Weekly workout logging (squats, push-ups, burpees) with trend analytics.
- **Scoreboard**: Automated calculation of weekly awards and points across all four scoring categories.
- **Scoring Engine**: Implements rules for KM Avg, Weight Loss Total, Lifestyle Avg, and Attendance Avg (+1 point per category winner; ties award all tied teams).
- **Member Progress Dashboard**: Participant-facing view at `/user` showing personal stats, benchmark trends, and attendance history.
- **PDF/Excel Export**: Export table data and summaries via jsPDF and XLSX.
- **Interactive Analytics**: Premium trend charts (Recharts) and dynamic dashboard animations (Framer Motion, React Spring).
- **Audit Trail**: All mutations are logged with user, entity type, entity ID, action, and timestamp.
- **Security**: Role-based authorization (ADMIN / PARTICIPANT), login throttling with lockout, and production-safe seed credentials.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router), React Compiler enabled |
| Language | TypeScript v5 |
| Database | PostgreSQL — Prisma v6 ORM |
| Styling | Tailwind CSS v4 (glassmorphism + Tongan Cultural Identity theme) |
| Authentication | NextAuth v5 (credentials provider + Prisma adapter) |
| Validation | Zod v4 |
| Testing | Vitest v4 |
| Data Visualization | Recharts v3, Framer Motion v12, React Spring v10 |
| Export | jsPDF v4 + jsPDF-AutoTable, XLSX v0.18 |
| Utilities | date-fns v4, bcryptjs v3, sonner v2 |

## Getting Started

### 1. Prerequisites

- Node.js v18+
- PostgreSQL (local or remote)

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/tf_dashboard?schema=public"

# NextAuth — generate with: openssl rand -base64 32
AUTH_SECRET="your_secure_random_string_here"

# Seed passwords (optional — omit in production to disable seeding)
SEED_ADMIN_PASSWORD="your_admin_password"
SEED_PARTICIPANT_PASSWORD="your_participant_password"
```

> **Note**: The `SEED_*_PASSWORD` variables gate the database seeder in production. If they are absent, the seed script will refuse to run, preventing accidental data exposure.

### 3. Installation

```bash
npm install
```

### 4. Database Setup

Push the schema and seed initial data (Block 1 sessions and default users):

```bash
npx prisma db push
npx prisma db seed
```

### 5. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

- **Admin login** → full dashboard access
- **Participant login** → redirects to `/user` (personal progress view)

### 6. Testing & Quality Checks

```bash
npm run test   # Vitest unit tests (11 test suites)
npm run lint   # ESLint v9
```

> The codebase has been fully audited and cleaned up. It builds and lints with 0 errors and 0 warnings.

## Folder Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Protected admin routes (dashboard, teams, members, scoreboard, …)
│   ├── user/               # Participant progress dashboard
│   ├── login/              # Authentication page
│   └── api/auth/           # NextAuth route handlers
├── actions/                # Server Actions — all data mutations
│   ├── auth-actions.ts
│   ├── block-actions.ts    # Block & week management
│   ├── scoring.ts          # Scoring engine mutations
│   ├── export-actions.ts   # PDF / Excel export
│   ├── import-actions.ts   # CSV import
│   └── data.ts             # General data operations
├── components/             # React components (organized by feature)
│   └── ui/                 # Reusable primitives (Button, Input, Card, …)
├── lib/                    # Core utilities & business logic
│   ├── scoring-logic.ts    # Pure scoring functions (calculateTeamMetrics, award winners)
│   ├── queries.ts          # Read-only DB queries (separated for static analysis)
│   ├── auth.ts             # NextAuth configuration
│   ├── auth-guard.ts       # Role-based authorization checks
│   ├── dates.ts            # UTC-safe date helpers (built on date-fns)
│   ├── login-throttle.ts   # Brute-force protection
│   ├── schemas.ts          # Zod validation schemas
│   ├── csvParser.ts        # CSV import parsing
│   ├── exportUtils.ts      # Export helpers
│   └── transformers/       # Data transformers (scoreboard, analytics)
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript type definitions
prisma/
├── schema.prisma           # Database schema
├── seed.ts                 # Seeding script
└── migrations/             # Migration history
scripts/
├── fix-date-integrity.mjs  # Backfill / validate UTC-midnight date consistency
├── backfill-points.mjs     # Recalculate point ledger entries
└── parse_excel.py          # Pre-process raw Excel exports before CSV import
```

## Database Models

| Model | Purpose |
|---|---|
| `Block` / `BlockWeek` | Training block and per-week snapshots (startDate, endDate, isFinalized) |
| `Team` / `Member` | Team entities and individual participants |
| `Session` / `Attendance` | MWF sessions and per-member attendance |
| `WeighIn` | Weight entries (unique per member + date) |
| `KmLog` | Weekly KM totals (unique per member + week) |
| `LifestyleLog` | Weekly social post counts |
| `BenchmarkLog` | Weekly workout reps (squats, push-ups, burpees) |
| `TeamWeekMetric` | Calculated team metrics per week (KM avg, weight loss, lifestyle avg, attendance avg) |
| `TeamWeekAward` | Category winners per week (`KM_AVG`, `WEIGHT_LOSS`, `LIFESTYLE_AVG`, `ATTENDANCE_AVG`) |
| `PointLedger` | Point transaction history |
| `AuditLog` | Immutable audit trail (userId, entityType, entityId, action, timestamp) |
| `User` / `Account` / `AuthSession` | NextAuth authentication models |

## Business Rules (Block 1)

- **Dates**: Jan 19, 2026 – Mar 16, 2026 (8 weeks)
- **Weeks**: Run Monday through Sunday; stored as UTC-midnight dates. Finalized atomically — once finalized, a week's metrics are locked.
- **Weigh-ins**: Happen on Mondays. A week's weight loss compares that Monday's weigh-in to the following Monday's. The final weigh-in falls on the Monday after the block ends.
- **Scoring**: Teams with **4 or more members** compete for +1 point per weekly category:
  1. KM Average
  2. Weight Loss Total
  3. Lifestyle Average
  4. Attendance Average

  Ties award a point to **every** tied team.

## Security

- **Role-based authorization**: All mutating, import, export, and scoring Server Actions require the `ADMIN` role. Participants only access their own `/user` data.
- **Login throttling**: Credential login attempts are rate-limited; repeated failures trigger a configurable lockout period.
- **Production seed gating**: The seed script checks for `SEED_*_PASSWORD` environment variables and aborts if they are absent, preventing accidental data seeding in production.
- **Audit logging**: Every mutation records the acting user, entity, and timestamp to `AuditLog`.
