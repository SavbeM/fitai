# FIT AI — AI‑powered fitness coach

FIT AI is a Next.js app that uses AI (OpenAI) + Prisma (MongoDB) to help users:
- create fitness projects (goal + description)
- generate a profile structure / biometrics schema
- generate a workout plan (WorkoutPlan + Activities)
- track activities and progress over time

This repo is currently a **work-in-progress**: the UI contains mock project data, and some “init flow” parts are partially mocked/stubbed.

---

## Tech stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS** + Preline
- **Prisma ORM** (MongoDB provider)
- **Jest** for tests
- **OpenAI Node SDK** (`openai`)

---

## Project structure (high level)

- `app/` — Next.js App Router pages, layouts, UI components
  - `app/(pages)/projects/page.tsx` — projects UI (currently mocked)
  - `app/api/*` — API routes
- `services/`
  - `services/ai_service/aiService.ts` — OpenAI-backed generation (profile, goals, activities, algorithm)
  - `services/database_service/` — Prisma-backed persistence + mapping helpers
  - `services/init_service/` — orchestration for project initialization (builder pattern; partially mocked)
- `prisma/schema.prisma` — MongoDB schema
- `__tests__/` — Jest tests (includes reusable DB acceptance tests)

---

## Data model (Prisma + MongoDB)

Defined in `prisma/schema.prisma`.

Core entities:
- `User`
- `Project` (belongs to `User`)
- `ConfigTemplate` (defines constraints/guidelines)
- `WorkoutPlan` (belongs to `Project`, uses `ConfigTemplate`)
- `Exercise`
- `Activity` (belongs to `WorkoutPlan`, references `Exercise`)

Relations / notes:
- `ConfigTemplate` ↔ `Exercise` is implemented as a join collection/model: `ConfigTemplateRecommendedExercise`.
  - This matters for cleanup in tests and for template updates (adding/removing recommended exercises).

Enums:
- `ExerciseType` (`NUMERIC`, `BOOLEAN`)
- `ActivityStatus` (`PLANNED`, `COMPLETED`, `SKIPPED`)
- `UnitType` (`KG`, `LB`, `REP`, `MIN`, `SEC`, `M`, `KM`, `CAL`, `NONE`)

---

## Requirements

- Node.js (modern LTS recommended)
- A MongoDB connection string that includes a **database name**

Example (Atlas):

```bash
DATABASE_URL="mongodb+srv://USER:PASS@HOST/fitai?retryWrites=true&w=majority"
```

Example (local MongoDB):

```bash
DATABASE_URL="mongodb://localhost:27017/fitai"
```

AI features require:

```bash
OPENAI_API_KEY="..."
```

---

## Getting started

1) Install dependencies

```bash
npm install
```

2) Create `.env`

```bash
cp .env.example .env
# if .env.example doesn't exist, create .env manually
```

3) Set env vars

```bash
DATABASE_URL="mongodb+srv://.../fitai?..."
OPENAI_API_KEY="..." # optional unless calling aiService or API routes that use it
```

4) Generate Prisma client

```bash
npx prisma generate
```

5) Run dev server

```bash
npm run dev
```

---

## API routes

> Some routes are still evolving.

- `GET /api/create-profile-structure`
  - Calls an init/middleware service to return a profile structure.

- `app/api/create-activities/socket.ts`
  - Currently empty (placeholder).

- `app/api/user/socket.ts`
  - Legacy-style handler (Pages Router style). This likely needs migration to App Router route handlers.

---

## Database service

`services/database_service/databaseService.ts`

Provides CRUD helpers for:
- User
- Project
- ConfigTemplate (includes helpers + recommended-exercises management)
- WorkoutPlan
- Activity
- Exercise

Notes:
- `createWorkoutPlan` takes a DTO: `{ projectId, templateId, activityIds? }`.

Mapping between raw DTOs and Prisma inputs lives in:
- `services/database_service/mapPrismaData.ts`

---

## Tests

### Unit/placeholder tests
- `__tests__/ai-service.test.ts` — currently a placeholder

### Database acceptance tests (recommended)
- `__tests__/db-service.test.ts`

These are designed as **re-runnable acceptance tests**:
- create their own fixtures
- track created IDs
- cleanup after each test
- skip automatically if `DATABASE_URL` is not set

Run:

```bash
npm test
# or only DB tests
npm run test-db
```

---

## Common issues

### “empty database name not allowed” (MongoDB Atlas)
Your `DATABASE_URL` is missing a database name.

✅ Must look like:

```bash
mongodb+srv://USER:PASS@HOST/<dbName>?...
```

### Prisma generate/client mismatch
If you change `schema.prisma`, rerun:

```bash
npx prisma generate
```

If types still look wrong, do a clean install:

```bash
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

---

## Roadmap / next steps

- Replace mocked UI projects with real DB-backed data.
- Finish `create-activities` API route.
- Consolidate init flow (`services/init_service/*`) with the current Prisma schema.
- Add acceptance tests for `aiService` (with API mocking).

---

## License

No license specified yet.
