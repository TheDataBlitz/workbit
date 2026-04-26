## Workbit API and Services Spec (v1)

This doc is the **source of truth** for how the **Workbit REST API** behaves and how clients (web/MCP/sdk) should call it.

- **Base URL**: `/api/v1`
- **Health**: `GET /health`
- **Auth**: every `/api/v1/*` route runs `optionalAuth` then `requireAuth`
  - Send **one** of:
    - `Authorization: Bearer <token>`
    - `X-API-Key: <key>` (or `x-api-key`)
- **Content model**: all user-editable `content` / `description` fields are **plain Markdown strings** (no Lexical JSON).
- **Data model**: **no teams**. Hierarchy is **workspace → projects → issues** (and project sub-resources).

### Conventions

- **JSON**: request + response bodies are JSON.
- **IDs**: opaque string IDs (often UUID-like); do not parse.
- **Dates**: ISO strings.
- **Errors**: non-2xx responses include a JSON payload with a message; treat as user-displayable plus loggable context.

---

## Workspaces

### List workspaces

- **GET** `/workspaces`
- **Response**
  - `{ workspaces: Workspace[] }`

### Create workspace

- **POST** `/workspaces`
- **Body**: `{ name: string; slug?: string; description?: string }`
- **Response**: `{ workspace: Workspace }`

### Update workspace

- **PATCH** `/workspaces/:workspaceId`
- **Body**: partial workspace fields (e.g. `{ name?: string; slug?: string; description?: string }`)
- **Response**: `{ workspace: Workspace }`

---

## Workspace-scoped convenience routes

These are “current workspace” endpoints used by the frontend.

### List projects in current workspace

- **GET** `/workspace/projects`
- **Response**: `ProjectListItem[]`

### Create project in current workspace

- **POST** `/workspace/projects`
- **Body**: `{ name: string; description?: string; workspaceId: string; status?: string }`
- **Response**: `{ project: Project }`

### List members (directory)

- **GET** `/workspace/members`
- **Response**: `Member[]`

### Create member

- **POST** `/workspace/members`
- **Body**: `{ name: string; username?: string; avatarSrc?: string; status?: string }`
- **Response**: `{ member: Member }`

### Invite member

- **POST** `/workspace/members/invite`
- **Body**: `{ email: string }`

### Provision member

- **POST** `/workspace/members/:memberId/provision`

---

## Projects

### Get project

- **GET** `/projects/:projectId`
- **Response**: `ProjectSummary`
  - Includes `workspaceId`

### Project properties

- **GET** `/projects/:projectId/properties`
- **Response**: `ProjectProperties`

### Assign project lead

- **POST** `/projects/:projectId/lead`
- **Body**: `{ leadId: string | null }`

### Project issues (list)

- **GET** `/projects/:projectId/issues`

### Status updates

- **GET** `/projects/:projectId/status-updates`
- **POST** `/projects/:projectId/status-updates`
  - **Body**: `{ status: string; content: string }` (Markdown `content`)

### Status update comments

- **GET** `/projects/:projectId/status-updates/:updateId/comments`
- **POST** `/projects/:projectId/status-updates/:updateId/comments`
  - **Body**: `{ content: string }` (Markdown `content`)

### Decisions

- **GET** `/projects/:projectId/decisions`
- **POST** `/projects/:projectId/decisions`
- **PATCH** `/projects/:projectId/decisions/:decisionId`
- **DELETE** `/projects/:projectId/decisions/:decisionId`
  - All decision long-form fields are Markdown strings.

### Documents

- **GET** `/projects/:projectId/documents`
- **POST** `/projects/:projectId/documents`
- **GET** `/projects/:projectId/documents/:documentId`
- **PATCH** `/projects/:projectId/documents/:documentId`
  - Document `content` is Markdown string.

### Agents

- **GET** `/projects/:projectId/agents`
- **POST** `/projects/:projectId/agents`
- **DELETE** `/projects/:projectId/agents/:agentKey`

---

## Issues

### Create issue

- **POST** `/issues`
- **Body**: `{ projectId: string; title: string; description?: string; parentIssueId?: string }`
  - `description` is Markdown string.

### Get issue

- **GET** `/issues/:issueId`

### Update issue

- **PATCH** `/issues/:issueId`
  - `description` is Markdown string.

### Sub-issues

- **GET** `/issues/:issueId/sub-issues`
- **POST** `/issues/:issueId/sub-issues/generate`

### Issue comments

- **GET** `/issues/:issueId/comments`
- **POST** `/issues/:issueId/comments`
  - **Body**: `{ content: string }` (Markdown `content`)

---

## Me

- **GET** `/me/member`
- **GET** `/me/ai-usage`
- **GET** `/me/notifications`

---

## API keys

- **POST** `/keys`
- **GET** `/keys`
- **DELETE** `/keys/:id`

---

## AI

- **POST** `/ai`
  - Used by the web app to request analysis/answers with tool-use.

---

## Agents catalog

- **GET** `/agents/catalog`

---

## Workspace MCP tools configuration

These endpoints manage which MCP tools are enabled per workspace.

- **GET** `/workspaces/:workspaceId/mcp-tools`
- **PUT** `/workspaces/:workspaceId/mcp-tools/:toolKey`

