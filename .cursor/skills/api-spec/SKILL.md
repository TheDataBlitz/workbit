---
name: api-spec
description: Maintain and use the Workbit REST API spec doc. Use when adding/changing API endpoints, updating web/api/mcp clients, or when the user asks for API documentation/spec updates.
---

# Workbit API Spec

## Quick start

- Treat `.cursor/docs/API_AND_SERVICES_SPEC.md` as the single source of truth.
- When modifying API routes/controllers/models:
  - Update the spec **in the same change** (endpoints, request/response shape, and any conventions).

## What to update in the spec

- **Routes**: path + method + purpose
- **Auth**: headers required; whether route is protected
- **Payloads**: required vs optional fields; mention Markdown fields explicitly
- **Breaking changes**: removals/renames (e.g. “teams removed; workspace → projects”)

## Repo conventions to respect

- API layering: routes → controllers → models → db
- Content fields: `description` / `content` are plain Markdown strings (no Lexical JSON)
- Data model: no teams; workspace → projects → issues

