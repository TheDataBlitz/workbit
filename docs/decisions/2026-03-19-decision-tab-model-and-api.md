# 2026-03-19: Decision Tab data model and API contract

## Context

Project execution needs a durable log of major/minor decisions and rationale. The log should support timeline views with deterministic ordering and project-level CRUD for frontend consumption.

## Decision

Introduce a `Decision` entity at project scope and expose REST endpoints under `/api/v1/projects/:projectId/decisions`.

### Entity model

- `id`: string (UUID)
- `projectId`: string
- `title`: string (required)
- `type`: `'major' | 'minor'` (required)
- `rationale`: string (required)
- `impact`: string (optional)
- `tags`: string[]
- `createdBy`: `{ id: string; name: string }`
- `decisionDate`: string (optional, ISO date)
- `status`: `'proposed' | 'approved' | 'rejected' | 'superseded'`
- `linkedIssueIds`: string[]
- `createdAt`: string (ISO timestamp)
- `updatedAt`: string (ISO timestamp)

### Ordering modes

- `mixed`: sort by `decisionDate` desc, fallback to `createdAt` desc, then `id` asc for deterministic tie-break.
- `sequential`: sort by `createdAt` desc, then `id` asc.
- `order=asc` reverses the computed result.

### Endpoints

- `GET /api/v1/projects/:projectId/decisions`
- `POST /api/v1/projects/:projectId/decisions`
- `PATCH /api/v1/projects/:projectId/decisions/:decisionId`
- `DELETE /api/v1/projects/:projectId/decisions/:decisionId`

### Query parameters for list

- `type`: `major | minor`
- `status`: `proposed | approved | rejected | superseded`
- `fromDate`: ISO date (applies to `decisionDate`)
- `toDate`: ISO date (applies to `decisionDate`)
- `mode`: `mixed | sequential` (default `mixed`)
- `order`: `asc | desc` (default `desc`)
- `page`: positive integer (default `1`)
- `pageSize`: positive integer <= `100` (default `20`)

### List response shape

```json
{
  "items": [
    {
      "id": "d-1",
      "projectId": "p-1",
      "title": "Swap OAuth provider",
      "type": "major",
      "rationale": "Current provider quota is blocking onboarding",
      "impact": "2-week rework on auth integration",
      "tags": ["auth", "timeline"],
      "createdBy": { "id": "u-1", "name": "You" },
      "decisionDate": "2026-03-18",
      "status": "approved",
      "linkedIssueIds": ["12-AU"],
      "createdAt": "2026-03-18T10:00:00.000Z",
      "updatedAt": "2026-03-18T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

### Create request example

```json
{
  "title": "Defer mobile beta",
  "type": "major",
  "rationale": "Backend performance is unstable under peak load",
  "impact": "Beta launch moves by two sprints",
  "tags": ["mobile", "release"],
  "decisionDate": "2026-03-19",
  "status": "approved",
  "linkedIssueIds": ["03-WT"]
}
```

### Update request example

```json
{
  "status": "superseded",
  "impact": "Decision replaced after architecture review"
}
```

## Acceptance criteria

- Decision CRUD works at project scope.
- List supports filters, pagination, and both ordering modes.
- Sorting is deterministic for equal dates.
- API response shape remains stable for frontend integration.

## Consequences

- Requires `decisions` table migration in Supabase.
- Frontend can implement Decision tab without team-scoped API coupling.
