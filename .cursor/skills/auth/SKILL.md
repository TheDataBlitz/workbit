---
name: auth
description: Auth on frontend (Supabase client, token) and API (middleware, Bearer/API key). Use when touching login, session, API auth, or auth-related env.
---

# Auth (Frontend and API)

Auth is split: **frontend** uses the Supabase browser client and exposes a token for API calls; **API** validates Bearer JWT or API key and sets `req.user`. Before changing auth, billing, or migrations, read the local CLAUDE.md in that directory.

## Frontend (`src/pages/auth/`)

- **Env:** Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never use service role or server secrets in the frontend.
- **Client:** `supabaseClient.ts` exposes `getSupabase()` and `getAccessToken()`. Use `getAccessToken()` when calling the API (Bearer token).
- **Guards:** Check `isAuthConfigured` before assuming auth. Handle `getSupabase()` / `getAccessToken()` returning `null`.
- **API calls:** The app uses `src/api/client.ts`; it calls `getAccessToken()` and sends `Authorization: Bearer <token>` when available.

Do not add server-side auth logic or service-role usage in the frontend. API auth lives in `api/src/middleware/auth.ts`.

## API (`api/src/middleware/auth.ts`)

- **optionalAuth** runs first on `/api/v1`: if Supabase is configured, tries (1) Bearer as Supabase JWT → `req.user`, (2) X-API-Key or Bearer as API key → lookup and set `req.user`. Otherwise `req.user` stays undefined.
- **requireAuth** (after `optionalAuth`): requires a valid session (401 if missing, 501 if Supabase not configured), except for `/api/v1/auth/*` (e.g. login).
- **Helpers:** `getUserId(req)` returns `req.user?.id`; use in controllers that need the current user.

## Auth routes

- `POST /api/v1/auth/login` – body `{ email, password }`; uses Supabase `signInWithPassword`. See `api/src/controllers/authController.ts` and `api/src/utils/supabaseServer.ts` (anon client for auth ops).

## References

- **Frontend auth:** `src/pages/auth/CLAUDE.md`, `src/pages/auth/supabaseClient.ts`.
- **API auth:** `api/src/middleware/auth.ts`.
- **DB / service role:** `api/src/db/CLAUDE.md` (service role only in API, never in frontend).
