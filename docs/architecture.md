# Architecture overview

Workbit is a full-stack app: React frontend and Express API, with Supabase for auth and data.

## High level

- **Frontend:** Single-page app (Vite + React). Entry: `src/main.tsx`. Routes in `src/route/`; screens in `src/pages/`. Data via `src/api/client.ts` (REST). UI from `src/design-system/`. Logbit for logging/errors.
- **API:** Express server in `api/src/`. Entry: `api/src/index.ts`. REST endpoints; controllers → models → db. Supabase client in `api/src/db/`. Auth middleware in `api/src/middleware/auth.ts`.
- **Data:** Supabase (Postgres). Migrations in `supabase/migrations/`. Frontend auth uses Supabase client in `src/pages/auth/`; API uses server-side client for DB and auth checks.
- **Observability:** Logbit SDK in frontend and API (see `.cursor/docs/LOGBIT_SDK.md`).

## Where to look

| Topic | Location |
|-------|----------|
| API contract & screens | `.cursor/docs/API_AND_SERVICES_SPEC.md` |
| Issue `description` (Lexical coercion, images) | `api/README.md` — *Issue descriptions (Lexical)*; `api/src/utils/issueDescriptionLexical.ts` |
| Design system | `.cursor/docs/DESIGN_SYSTEM.md`, `src/design-system/` |
| Logging & errors | `.cursor/docs/LOGBIT_SDK.md`, `.cursor/skills/use-logbit/SKILL.md` |
| Project layout & naming | Root `CLAUDE.md`, `.cursor/skills/project-structure/SKILL.md` |
| Decisions | `docs/decisions/` (ADRs) |
| Operations | `docs/runbooks/` |

Keep this file as a map. Put detailed decisions in `docs/decisions/` and operational steps in `docs/runbooks/`.
