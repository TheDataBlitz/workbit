# Workbit API

Node.js + TypeScript + Express API. Data is stored in a JSON file (`data.json`) by default, or in **Supabase** when configured. Email-based auth is supported via Supabase Auth.

## Setup

```bash
cd api
npm install
```

## Run

- **Development:** `npm run dev` (tsx watch, default port 3001)
- **Production:** `npm run build && npm start`

Override port: `PORT=4000 npm run dev`. Override data file directory: `DATA_DIR=./storage npm run dev`.

## Supabase (optional)

To use Supabase instead of the file store and enable email auth:

1. **Create the database tables in Supabase** (required before `npm run seed` or API use):
   - Open your [Supabase project](https://supabase.com/dashboard) → **SQL Editor**.
   - Run the SQL in **`api/scripts/create-separate-tables.sql`**. This creates separate tables: `projects`, `teams`, `members`, `views`, `roles`, `invitations`, `status_updates`, `project_properties`, `milestones`, `activity`, `issues`, `notifications`, and `comments`.
2. Copy `api/.env.example` to `api/.env` and set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (from Supabase → Settings → API). The API loads `api/.env` automatically when you run `npm run seed` or `npm run dev` from the `api` folder.
3. **Run seed:** `cd api && npm run seed`. This inserts dummy data into the separate tables.
4. When these env vars are set, the API reads/writes from Supabase and requires a valid Supabase JWT for all `/api/v1` requests. Send `Authorization: Bearer <access_token>` from the frontend.

Without Supabase env vars, the API uses `data.json`. The seed script does not create tables; it only inserts/updates data.

## Structure

- `src/controllers/` – request handlers
- `src/models/` – types and data access (file-backed or Supabase)
- `src/middleware/` – optional Supabase JWT auth
- `src/routes/` – Express route definitions
- `src/utils/` – file store, Supabase store, seed

## Endpoints (as per spec)

- **Workspace:** `GET /api/v1/workspace/projects|members|roles`, `POST /api/v1/workspace/members/invite`
- **Projects:** `GET /api/v1/projects/:projectId`, `GET /api/v1/projects/:projectId/issues`, `GET/POST /api/v1/projects/:projectId/status-updates`, `GET/POST /api/v1/projects/:projectId/status-updates/:updateId/comments`
- **Issues:** `POST /api/v1/issues` (requires `projectId`), `PATCH /api/v1/issues/:issueId`
- **Me:** `GET /api/v1/me/notifications`

First run creates `data.json` with seed data if the store is empty.
