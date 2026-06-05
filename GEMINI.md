# GEMINI.md - TO’A FATALONA Admin Dashboard

## Project Overview
The **TO’A FATALONA Admin Dashboard** is a fitness management system built for administering "TO’A FATALONA" training blocks. It tracks team and member performance across attendance, weigh-ins, physical activity (KM logs), and lifestyle metrics. The system features an automated scoring engine that calculates weekly awards and points.

### Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19 (React Compiler enabled)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (v5)
- **Styling**: Tailwind CSS v4 (featuring a Tongan Cultural Identity theme)
- **Visuals**: Recharts, Framer Motion, React Spring
- **Testing**: Vitest

### Architecture & Key Modules
- **`src/app`**: App Router pages and Server Actions.
- **`src/actions`**: Server-side logic for data mutations (scoring, imports, auth).
- **`src/lib/scoring-logic.ts`**: The core "pure" business logic for calculating metrics and determining winners.
- **`src/lib/prisma.ts`**: Singleton Prisma client instance.
- **`prisma/schema.prisma`**: Database schema defining Blocks, Weeks, Teams, Members, and Activity Logs.

## Building and Running

### Setup
1. **Install Dependencies**: `npm install`
2. **Environment**: Copy `.env.example` to `.env` and configure:
   - `DATABASE_URL`: PostgreSQL connection URL (e.g. `postgresql://user:password@localhost:5432/tf_dashboard?schema=public`)
   - `AUTH_SECRET`: NextAuth authentication secret. Generate one using:
     ```bash
     openssl rand -base64 32
     ```
3. **Database**: 
   - `npx prisma db push` (Sync the database schema)
   - `npx prisma db seed` (Populate initial data: Block 1, Sessions, Teams, Members, and Logs)

### Development Credentials
Once seeded, the database contains default users for local testing:
- **Admin User**:
  - Email: `admin@toafatalona.com`
  - Password: `password123`
- **Participant User** (linked to the first member):
  - Email: `participant@test.com`
  - Password: `participant123`

### Key Commands
- **Development**: `npm run dev` (Starts Next.js dev server on http://localhost:3000)
- **Testing**: `npm run test` (Runs test suite via Vitest)
- **Linting**: `npm run lint` (Runs ESLint check)
- **Build**: `npm run build` (Compiles production build)

### Data & Maintenance Scripts
The project includes support scripts in the `scripts/` directory:
- **`scripts/parse_excel.py`**: A Python pre-processing script to parse Block 1 Excel files (Weigh-In, KM, Lifestyle, Attendance spreadsheets) in the `docs/` folder. It compiles them into `prisma/data/imported_data.json` for consumption by the seed script. Requires `openpyxl`.
- **`scripts/backfill-points.mjs`**: A Node utility script to backfill `PointLedger` entries lacking `blockId` to the first active block. Run with:
  ```bash
  node scripts/backfill-points.mjs
  ```

## Development Conventions

### Coding Standards
- **Server Actions**: Use `src/actions` for all data mutations. Ensure `revalidatePath` is called to refresh the UI.
- **Validation**: Use **Zod** (via `src/lib/schemas.ts`) for all external data parsing, especially CSV imports.
- **Styling**: Adhere to the Tongan cultural theme. Use utility patterns from `src/components/ui/Patterns.tsx`.
- **Logic Isolation**: Keep complex calculations in `src/lib` as pure functions (e.g., `scoring-logic.ts`) to maintain testability.

### Scoring & Business Rules
- **Team Eligibility**: Only teams with 4 or more active members are eligible for weekly +1 point awards.
- **Weight Loss Formula**: `Weight(Current Week) - Weight(Next Week)`.
- **Award Categories**: KM Average, Weight Loss Total, Lifestyle Average, and Attendance Average.
- **Finalization**: Weeks are finalized via `FinalizeWeekWizard` to lock in scores and record points in the `PointLedger`.

### Data Management
- **Imports**: CSV imports (Attendance, KM, Lifestyle, Weigh-in) are handled in `src/actions/import-actions.ts`.
- **Exports**: PDF and Excel exports are managed in `src/actions/export-actions.ts`.
