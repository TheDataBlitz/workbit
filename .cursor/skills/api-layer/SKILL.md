---
name: api-layer
description: Backend API layer: routes → controllers → models → db. Use when adding or changing API endpoints, controllers, models, or route wiring in api/src.
---

# API Layer (Backend)

The API is Express under `api/src/`. All writes are **REST**; the frontend uses `src/api/client.ts`. Keep a strict layering: routes are thin, controllers handle HTTP and call models, models contain domain logic and call `db/` only.

## Flow

1. **Routes** (`api/src/routes/`) – Mount routers; delegate to controller functions. No business logic.
2. **Controllers** (`api/src/controllers/`) – Parse `req`/`res`, validate input, call **models**, return JSON. Use `logApiError` / `logApiWarn` from `api/src/utils/log.js` for errors.
3. **Models** (`api/src/models/`) – Domain logic; call `db/` and optionally `utils/`. No direct Supabase in controllers.
4. **DB** (`api/src/db/`) – Data access only. See the `db-supabase` skill.

## Conventions

- **Imports:** Use **relative imports with `.js` extension** (Node ESM): `import * as ctrl from '../controllers/issuesController.js'`, `import * as db from '../db/issues.js'`.
- **Auth:** All routes under `/api/v1` get `optionalAuth` then `requireAuth`. Use `getUserId(req)` from `../middleware/auth.js` when you need the current user; handle missing user (401) in the controller.
- **Mounting:** Register new routers in `api/src/index.ts` (e.g. `app.use(API_PREFIX + '/issues', issuesRoutes)`).
- **Contract:** Align request/response shapes with `.cursor/docs/API_AND_SERVICES_SPEC.md` where applicable.

## Adding a new domain

1. **DB:** Add `api/src/db/domainName.ts` (and migration if new tables). Use `getClient()` from `db/client.js`.
2. **Model:** Add `api/src/models/domainName.ts`; import from `../db/domainName.js`; add shared types to `models/types.ts` if needed.
3. **Controller:** Add `api/src/controllers/domainNameController.ts`; call model functions; use `logApiError` on catch.
4. **Routes:** Add `api/src/routes/domainName.ts`; wire methods to controller; export router.
5. **Index:** Mount the router in `api/src/index.ts`.

## References

- **Auth:** `.cursor/skills/auth/SKILL.md`, `api/src/middleware/auth.ts`.
- **DB:** `.cursor/skills/db-supabase/SKILL.md`, `api/src/db/CLAUDE.md`.
- **Logging:** `.cursor/skills/use-logbit/SKILL.md`, `api/src/utils/log.ts`.
