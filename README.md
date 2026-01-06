# FIT AI — AI‑powered fitness coach

FIT AI is a Next.js app that uses AI (OpenAI) + Prisma (MongoDB) to help users:
- create fitness projects 
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
  - `services/ai_service/` — OpenAI-backed semantic search and template selection
  - `services/database_service/` — Prisma-backed persistence + mapping helpers
  - `services/init_service/` — orchestration for project initialization (builder pattern; WIP)
  - `services/search_service/` — search service for finding relevant ConfigTemplates
- `prisma/schema.prisma` — MongoDB schema
- `__tests__/` — Jest tests (includes reusable DB acceptance tests)

---

## AI Service (`services/ai_service/`)

The AI service provides intelligent template selection using OpenAI. It implements a RAG-ish (Retrieval Augmented Generation) approach.

### Module Structure

| File | Description |
|------|-------------|
| `semantic_search.ts` | Main entry point. Fetches candidates from DB, sends to OpenAI, validates response. |
| `prompts.ts` | System and user prompt templates for OpenAI chat completions. |
| `AIServiceTypes.ts` | TypeScript types and Zod schemas for input/output validation. |

### How It Works

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  User Input     │───▶│  Fetch DB       │───▶│  OpenAI API     │
│  title + desc   │    │  Candidates     │    │  (gpt-5-nano)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                       ┌─────────────────┐            │
                       │  Zod Validate   │◀───────────┘
                       │  + Guard Check  │
                       └─────────────────┘
                               │
                       ┌─────────────────┐
                       │  AiTemplatePick │
                       │  (result)       │
                       └─────────────────┘
```

1. **Validate input** — Zod schema ensures title/description are non-empty strings.
2. **Fetch candidates** — Retrieves ConfigTemplates from MongoDB (limited by `candidateLimit`).
3. **Build prompt** — Creates structured prompt with project info and candidate list.
4. **Call OpenAI** — Uses `gpt-5-nano` with JSON response mode (temperature=0).
5. **Validate response** — Zod schema validates AI response structure.
6. **Guard check** — Ensures picked `templateId` exists in candidate list (prevents hallucination).

### Types & Schemas

#### `SemanticSearchInput` (Input DTO)

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | `string` | ✅ | Short project goal (e.g., "Bench press strength"). |
| `description` | `string` | ✅ | Detailed project description with user intent. |
| `candidateLimit` | `number` | ❌ | Max templates to pass to AI (1–200, default ~30). |

#### `AiTemplatePick` (Output DTO)

| Property | Type | Description |
|----------|------|-------------|
| `status` | `"ok" \| "not_found" \| "inconsistent"` | Selection outcome. |
| `templateId` | `string?` | Selected ConfigTemplate ID (only when status is "ok"). |
| `confidence` | `number?` | Model confidence score (0–1). |
| `reason` | `string?` | Human-readable explanation. |

### Usage Example

```ts
import { semanticSearchConfigTemplate } from "@/services/ai_service/semantic_search";

const result = await semanticSearchConfigTemplate({
  title: "Bench press strength",
  description: "I want to increase my 1RM bench press",
  candidateLimit: 20,
});

if (result.status === "ok") {
  console.log("Best template:", result.templateId);
  console.log("Confidence:", result.confidence);
} else {
  console.log("No match:", result.reason);
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | OpenAI API key for chat completions. |
| `DATABASE_URL` | ✅ | MongoDB connection string (for fetching candidates). |

---

## Init flow (WIP): ProjectBuilder + InitProjectService

Project initialization is implemented as a **step-based orchestration**. The goal is to execute several steps and be able to stream intermediate progress to the client.

Current implementation is the **first step only**:

- `services/init_service/projectBuilder.ts`
  - `createProject()`
    - Persists a new `Project` in DB using `databaseService.createProject()`
    - Saves created project into internal builder context
    - Returns a `ProjectBuilderResponse` in a standard format:
      - `{ step, success, message }`

- `services/init_service/initProjectService.ts`
  - `initProject(userId, title, description, callback)`
    - Creates a `ProjectBuilder`
    - Executes `builder.createProject()`
    - Calls `callback(stepResponse)` so API layer can stream this step result

Validation of input payloads is done with Zod in:
- `lib/validation-schema-zod.ts`

---

## API routes

> Some routes are still evolving.

### WebSocket: Create project (init step 1)

**Route:** `GET /api/create-project` (WebSocket upgrade)

This endpoint is implemented as a WebSocket route handler via `next-ws`:
- file: `app/api/create-project/route.ts`
- runtime: `nodejs`

**Non-WS request behavior**:
- `GET /api/create-project` returns `426 Upgrade Required` and sets:
  - `Connection: Upgrade`
  - `Upgrade: websocket`

#### Client → Server message

The server expects JSON that matches `ClientMessageSchema`:

- `type` is a literal: `"create-project"`
- `payload`:
  - `userId: string`
  - `title: string`
  - `description: string`

Example:

```json
{
  "type": "create-project",
  "payload": {
    "userId": "507f191e810c19729de860ea",
    "title": "Lose 5kg in 2 months",
    "description": "Need a plan for home workouts 3x/week"
  }
}
```

#### Server → Client messages

The server sends `ServerMessage` messages:
- `{ "type": "hello" }` — immediately after connect
- `{ "type": "step", "payload": { "step": "CREATE_PROJECT", "success": true, "message": "..." } }` — per step
- `{ "type": "error", "payload": { "message": "..." } }` — parsing/validation/runtime error

#### How to test

**Postman**
1. Create **WebSocket Request** (not HTTP request)
2. Connect to: `ws://localhost:3000/api/create-project`
3. Send the JSON payload from the example above

If Postman shows `socket hang up`, validate the endpoint using a Node client (below). Postman can be flaky with WS extensions/compression.

**Node.js (ws) quick test**

```bash
node - <<'NODE'
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/api/create-project');
ws.on('open', () => {
  console.log('open');
  ws.send(JSON.stringify({
    type: 'create-project',
    payload: {
      userId: '507f191e810c19729de860ea',
      title: 'Test title',
      description: 'Test description'
    }
  }));
});
ws.on('message', (m) => console.log('message', m.toString()));
ws.on('error', (e) => console.error('error', e));
NODE
```

### Other routes (legacy/WIP)

- `GET /api/create-profile-structure`
  - Calls an init/middleware service to return a profile structure.

- `app/api/create-activities/socket.ts`
  - Currently empty (placeholder).

- `app/api/user/socket.ts`
  - Legacy-style handler (Pages Router style). This likely needs migration to App Router route handlers.

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
OPENAI_API_KEY="..." # optional unless calling semantic_search or API routes that use it
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

## Search service (Atlas Search + extensible strategies)

`services/search_service/`

This module provides an **extensible search layer** for selecting the most relevant `ConfigTemplate`.

### What it does today

- Runs **MongoDB Atlas Search** against the `ConfigTemplate` collection.
- Match logic (current contract):
  - searches **`ConfigTemplate.tags`** using the user-provided project **`title`**
  - searches **`ConfigTemplate.description`** using the user-provided project **`description`**

Entry point:
- `SearchService.searchConfigTemplates(input)`

### Input / Output contract

**Input** (`TemplateSearchInput`):
- `title: string` (required)
- `description: string` (required)

**Output** (`TemplateSearchResult`):
- `hits`: array of `{ templateId, score?, highlights? }`
- `meta`: `{ strategy, indexName, executionMs? }`

### Atlas Search requirements

The Atlas implementation uses `$search` in an aggregation pipeline via Prisma `aggregateRaw()`:
- file: `services/search_service/atlasTemplateSearch.ts`
- default index name: `configTemplate_text`

You must create an Atlas Search index for the `ConfigTemplate` collection that supports:
- `tags` (array of strings)
- `description` (string)

Notes:
- This service searches **only** the fields above (per `prisma/schema.prisma`).
- If you use a different index name, pass it via `new AtlasTemplateSearch({ indexName: "..." })`.

### Usage example

```ts
import { SearchService } from "@/services/search_service/searchService";

const searchService = new SearchService();

const result = await searchService.searchConfigTemplates({
  title: "Bench press strength",
  description: "I want to increase my 1RM. 3 workouts per week.",
});

// Top hit ID (if any)
const bestTemplateId = result.hits[0]?.templateId;
```

### Extending later: AI fallback strategy

`SearchService` is built around a strategy interface:
- `TemplateSearchStrategy.searchConfigTemplates(input)`

Right now `SearchService` uses the Atlas strategy by default.
In the future you can inject an AI semantic strategy as a fallback:

```ts
import { SearchService } from "@/services/search_service/searchService";

const searchService = new SearchService({
  atlas: /* your Atlas strategy (default if omitted) */,
  ai: /* your AI strategy implementing TemplateSearchStrategy */,
});
```

---

## Tests

### AI service integration tests
- `__tests__/ai-service.test.ts`
  - **Requires**: `DATABASE_URL` and `OPENAI_API_KEY` (skipped if missing)
  - **Case 1**: Model correctly identifies best matching template
  - **Case 2**: Model handles no-match scenario (not_found/inconsistent/fallback)
  - **Case 3**: Zod validation rejects invalid input at runtime

### Init service (unit tests)
- `__tests__/init-service.test.ts`
  - covers `ProjectBuilder.createProject()`
  - covers `InitProjectService.initProject()`

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
- Add acceptance tests for `semantic_search` (with API mocking).

---

## License

No license specified yet.
