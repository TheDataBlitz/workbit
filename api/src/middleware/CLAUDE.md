# Auth middleware — gotchas

This folder handles **API** authentication. Sensitive: mistakes can open or lock down endpoints incorrectly.

## Behavior

- **optionalAuth:** Tries (1) `Authorization: Bearer <JWT>` as Supabase JWT → sets `req.user`; (2) if no user, `x-api-key` or Bearer as API key → looks up `api_keys`, sets `req.user` by `user_id`. If neither works, `req.user` stays undefined. Use for routes that work for both anonymous and signed-in users. On successful auth it also sets `req.workbitUpstreamAuth` (`bearer` or `apiKey`) for the MCP proxy subprocess. **Never log** `workbitUpstreamAuth`.
- **requireAuth:** Mounted in `index.ts` after `optionalAuth` for `/api/v1`; skips `/api/v1/auth/*`, otherwise 501 if Supabase not configured, 401 if no `req.user`.
- **Secrets:** Uses `supabaseAdmin` (service role) from `utils/supabaseServer.js` only for JWT verification and API key lookup. No secrets in this file; env is loaded in `loadEnv.js`.

## Rules

- Don’t log tokens or API keys. Log only safe metadata (e.g. “auth failed”, “user id present”).
- Don’t add new auth mechanisms without updating this file and documenting in `docs/decisions/`.
- When changing JWT or API key handling, manually test login and API key flows (no automated test suite in this project).
