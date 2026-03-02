# API & Data Services Specification

This document defines API requirements for all screens and components, with **GraphQL for GET** (queries) and **REST for POST/PUT/DELETE** (mutations). It also specifies the services and hooks to create for data fetching.

---

## 1. Conventions

| Operation | Protocol | Use case |
|-----------|----------|----------|
| **Read (GET)** | GraphQL Query | List/fetch entities, nested data, flexible fields |
| **Create** | REST POST | New resources (updates, comments, invites, etc.) |
| **Update** | REST PUT/PATCH | Edit existing resources |
| **Delete** | REST DELETE | Remove resources |

- **GraphQL endpoint**: e.g. `POST /graphql` with query/mutation body (queries only for reads; mutations can be used if backend prefers GraphQL mutations for writes—otherwise REST).
- **REST base**: e.g. `/api/v1/...` for all non-query operations.

---

## 2. Screens & API Requirements

### 2.1 Workspace-level screens

#### Workspace Projects (`WorkspaceProjectsScreen`)

| Need | Type | API |
|------|------|-----|
| List all workspace projects | GET | **GraphQL** `workspaceProjects` or `projects(scope: WORKSPACE)` |
| **Query fields**: `id`, `name`, `team { id, name }`, `status` |

**GraphQL (example):**

```graphql
query WorkspaceProjects {
  workspace {
    projects {
      id
      name
      team { id name }
      status
    }
  }
}
```

---

#### Workspace Teams (`WorkspaceTeamsScreen`)

| Need | Type | API |
|------|------|-----|
| List workspace teams with member count & linked project | GET | **GraphQL** `workspaceTeams` |
| **Query fields**: `id`, `teamName`/`name`, `memberCount`, `project { id, name }` (or `projectName`) |

**GraphQL (example):**

```graphql
query WorkspaceTeams {
  workspace {
    teams {
      id
      name
      memberCount
      project { id name }
    }
  }
}
```

---

#### Workspace Members (`WorkspaceMemberScreen`)

| Need | Type | API |
|------|------|-----|
| List workspace members | GET | **GraphQL** `workspaceMembers` |
| Invite member | POST | **REST** `POST /api/v1/workspace/members/invite` |
| **Query fields**: `id`, `name`, `username`, `avatarSrc`, `status`, `joined`, `teams` (summary string or list) |

**GraphQL (example):**

```graphql
query WorkspaceMembers {
  workspace {
    members {
      id
      name
      username
      avatarSrc
      status
      joined
      teams { id name }
    }
  }
}
```

**REST (example):**

- `POST /api/v1/workspace/members/invite`  
  Body: `{ "email": string, "roleId"?: string }`

---

#### Workspace Views (`WorkspaceViewsScreen`)

| Need | Type | API |
|------|------|-----|
| List workspace views | GET | **GraphQL** `workspaceViews` |
| **Query fields**: `id`, `name`, `type`, `owner { id, name }` |

**GraphQL (example):**

```graphql
query WorkspaceViews {
  workspace {
    views {
      id
      name
      type
      owner { id name }
    }
  }
}
```

---

#### Workspace Roles (`WorkspaceRolesScreen`)

| Need | Type | API |
|------|------|-----|
| List workspace roles | GET | **GraphQL** `workspaceRoles` |
| **Query fields**: `id`, `role`, `memberCount`, `description` |

**GraphQL (example):**

```graphql
query WorkspaceRoles {
  workspace {
    roles {
      id
      role
      memberCount
      description
    }
  }
}
```

---

#### Inbox (`InboxScreen`)

| Need | Type | API |
|------|------|-----|
| List notifications/updates for current user | GET | **GraphQL** `inbox` or `notifications` |
| **Query fields**: `id`, `type`, `title`, `body`, `read`, `createdAt`, `actor { id, name }`, `targetUrl`? |

**GraphQL (example):**

```graphql
query Inbox {
  me {
    notifications(first: 50) {
      nodes {
        id
        type
        title
        body
        read
        createdAt
        actor { id name }
        targetUrl
      }
    }
  }
}
```

---

#### My Issues (`MyIssuesScreen`)

| Need | Type | API |
|------|------|-----|
| List issues assigned to current user (all teams) | GET | **GraphQL** `myIssues` or `issues(assignee: ME)` |
| **Query fields**: same as `Issue` (id, title, assignee, date, status, etc.) |

**GraphQL (example):**

```graphql
query MyIssues {
  me {
    assignedIssues {
      id
      title
      assignee { id name }
      date
      status
      team { id name }
      project { id name }
    }
  }
}
```

---

#### Workspace More (`WorkspaceMoreScreen`)

| Need | Type | API |
|------|------|-----|
| Optional: workspace settings or meta | GET | **GraphQL** `workspace { settings, ... }` if needed later |

No mandatory API until screen has concrete features.

---

### 2.2 Team-level screens

#### Team Projects (`TeamProjectsScreen`)

| Need | Type | API |
|------|------|-----|
| Current team context | — | From route `teamId` + **GraphQL** `team(teamId)` if needed |
| Latest status update + list of updates | GET | **GraphQL** `teamProjectUpdates(teamId)` or `project(teamId).statusUpdates` |
| Comments for an update | GET | **GraphQL** `statusUpdateComments(updateId)` |
| Post status update | POST | **REST** `POST /api/v1/teams/:teamId/project/updates` |
| Post comment on update | POST | **REST** `POST /api/v1/teams/:teamId/project/updates/:updateId/comments` |
| Project status panel: properties, milestones, activity | GET | **GraphQL** `teamProject(teamId) { properties, milestones, activity }` |

**GraphQL (example):**

```graphql
query TeamProjectPage($teamId: ID!) {
  team(id: $teamId) {
    id
    name
    project {
      id
      statusUpdates(first: 20) {
        nodes {
          id
          status
          content
          author { id name avatarSrc }
          createdAt
          commentCount
        }
      }
      properties { status priority lead members dates teams labels }
      milestones { id name progress total targetDate }
      activity { id icon message date }
    }
  }
}

query StatusUpdateComments($updateId: ID!) {
  statusUpdate(id: $updateId) {
    id
    comments {
      id
      authorName
      content
      timestamp
    }
  }
}
```

**REST (example):**

- `POST /api/v1/teams/:teamId/project/updates`  
  Body: `{ "content": string, "status": "on-track" | "at-risk" | "off-track" }`
- `POST /api/v1/teams/:teamId/project/updates/:updateId/comments`  
  Body: `{ "content": string }`

**Milestones (Team Projects):**

| Need | Type | API |
|------|------|-----|
| List/create/update milestones | GET | **GraphQL** `team(teamId).project.milestones` |
| Create milestone | POST | **REST** `POST /api/v1/teams/:teamId/project/milestones` |
| Update milestone (name, targetDate, description) | PATCH | **REST** `PATCH /api/v1/teams/:teamId/project/milestones/:milestoneId` |
| Update project properties (status, priority, dates, etc.) | PATCH | **REST** `PATCH /api/v1/teams/:teamId/project` |

---

#### Team Issues (`TeamIssuesScreen`)

| Need | Type | API |
|------|------|-----|
| List issues for team (filter by tab: all / active / backlog) | GET | **GraphQL** `teamIssues(teamId, filter)` |
| Update issue status | PATCH | **REST** `PATCH /api/v1/issues/:issueId` (e.g. `{ "status": string }`) |
| **Query fields**: `id`, `title`, `assignee`, `date`, `status` |

**GraphQL (example):**

```graphql
query TeamIssues($teamId: ID!, $filter: IssueFilter) {
  team(id: $teamId) {
    id
    name
    issues(filter: $filter) {
      id
      title
      assignee { id name }
      date
      status
    }
  }
}
```

**REST (example):**

- `PATCH /api/v1/issues/:issueId`  
  Body: `{ "status"?: string, "assigneeId"?: string, ... }`

---

#### Team Views (`TeamViewsScreen`)

| Need | Type | API |
|------|------|-----|
| List views for team | GET | **GraphQL** `team(teamId).views` |
| **Query fields**: `id`, `name`, `type`, `owner { id, name }` |

**GraphQL (example):**

```graphql
query TeamViews($teamId: ID!) {
  team(id: $teamId) {
    id
    views {
      id
      name
      type
      owner { id name }
    }
  }
}
```

---

#### Team Logs (`TeamLogsScreen`)

| Need | Type | API |
|------|------|-----|
| Activity/log entries for team | GET | **GraphQL** `team(teamId).logs` or `team(teamId).activity` |
| **Query fields**: `id`, `action`, `actor`, `timestamp`, `details` (or similar) |

**GraphQL (example):**

```graphql
query TeamLogs($teamId: ID!, $first: Int) {
  team(id: $teamId) {
    id
    logs(first: $first) {
      nodes {
        id
        action
        actor { id name }
        timestamp
        details
      }
    }
  }
}
```

---

### 2.3 Layout / global

#### Main layout (navbar, team switcher)

| Need | Type | API |
|------|------|-----|
| List teams for current user | GET | **GraphQL** `me { teams }` or `workspace { teams }` |
| **Query fields**: `id`, `name` (and optional avatar) |

**GraphQL (example):**

```graphql
query NavTeams {
  me {
    teams {
      id
      name
    }
  }
}
# or
query NavTeams {
  workspace {
    teams { id name }
  }
}
```

---

## 3. Components & API Mapping

Components that need data from APIs (or that trigger writes) are listed below. The actual fetch is done in **screens or hooks**; components receive data via props or context.

| Component | Data / action | Source (GraphQL query / REST) |
|-----------|----------------|-------------------------------|
| **ProjectsTable** | List projects | `WorkspaceProjects` query |
| **TeamsTable** | List teams | `WorkspaceTeams` query |
| **MembersTable** | List members; Invite | `WorkspaceMembers` query; `POST .../invite` |
| **ViewsTable** | List views | `WorkspaceViews` or `TeamViews` query |
| **RolesTable** | List roles | `WorkspaceRoles` query |
| **StatusUpdateCard** | Single update + comments | From `TeamProjectPage` + `StatusUpdateComments`; send comment via REST |
| **StatusUpdateComposer** | — | Post via REST `POST .../project/updates` |
| **ProjectStatusPanel** | Properties, milestones, activity | From `TeamProjectPage` (project subtree) |
| **PropertiesSection** | Property values | From project; updates via `PATCH .../project` |
| **MilestonesSection** | Milestone list | From project; create/update via REST milestones API |
| **ActivitySection** | Activity list | From project activity in same query |
| **MilestoneForm** | Single milestone edit | Create: POST milestone; Update: PATCH milestone |
| **TeamDropdown** | Teams list | `NavTeams` query |
| **Team issues list (TeamIssuesScreen)** | Issues + tab filter | `TeamIssues` query; status update via `PATCH .../issues/:id` |

---

## 4. Services to Create

Services are thin wrappers around HTTP/GraphQL clients. Suggested location: `src/services/`.

| Service | Responsibility |
|---------|-----------------|
| **graphqlClient** | Configure GraphQL client (e.g. Apollo or `fetch` to `POST /graphql`). Export `query<T>(document, variables)`. |
| **restClient** | Base REST client (base URL, auth headers). Export `get`, `post`, `put`, `patch`, `delete`. |
| **workspaceService** | Use GraphQL for: `workspaceProjects`, `workspaceTeams`, `workspaceMembers`, `workspaceViews`, `workspaceRoles`. Use REST for: `inviteMember`. |
| **projectService** | Use GraphQL for: `teamProject`, `teamProjectUpdates`, `statusUpdateComments`. Use REST for: `postStatusUpdate`, `postComment`, `createMilestone`, `updateMilestone`, `updateProject`. |
| **issueService** | Use GraphQL for: `teamIssues`, `myIssues`. Use REST for: `updateIssue`. |
| **teamService** | Use GraphQL for: `team` (by id), `teamViews`, `teamLogs`, `navTeams`. |
| **inboxService** | Use GraphQL for: `inbox` / `me.notifications`. Optional REST for mark-read if needed. |
| **viewService** | Use GraphQL for: `workspaceViews`, `teamViews`. |

Optional: a single **api** or **backend** module that re-exports these and the two clients.

---

## 5. Hooks to Create

Hooks live in `src/hooks/` and use the services above. They expose loading/error state and refetch where needed.

### 5.1 Workspace

| Hook | Purpose | Query / mutation |
|------|----------|-------------------|
| **useWorkspaceProjects** | List workspace projects | GraphQL `WorkspaceProjects` |
| **useWorkspaceTeams** | List workspace teams | GraphQL `WorkspaceTeams` |
| **useWorkspaceMembers** | List workspace members | GraphQL `WorkspaceMembers` |
| **useInviteMember** | Invite member (mutation) | REST `POST .../invite` |
| **useWorkspaceViews** | List workspace views | GraphQL `WorkspaceViews` |
| **useWorkspaceRoles** | List workspace roles | GraphQL `WorkspaceRoles` |

### 5.2 Team & project

| Hook | Purpose | Query / mutation |
|------|----------|-------------------|
| **useTeam** | Team by id (for name, etc.) | GraphQL `team(teamId)` (minimal fields) |
| **useTeamProject** | Full project for team (updates, properties, milestones, activity) | GraphQL `TeamProjectPage` |
| **useStatusUpdateComments** | Comments for one status update | GraphQL `StatusUpdateComments` (or embedded in project query) |
| **usePostStatusUpdate** | Post new status update | REST `POST .../project/updates` |
| **usePostStatusComment** | Post comment on update | REST `POST .../project/updates/:id/comments` |
| **useUpdateProject** | Update project/properties | REST `PATCH .../project` |
| **useCreateMilestone** | Create milestone | REST `POST .../project/milestones` |
| **useUpdateMilestone** | Update milestone | REST `PATCH .../project/milestones/:id` |
| **useTeamViews** | List team views | GraphQL `TeamViews` |
| **useTeamLogs** | List team logs | GraphQL `TeamLogs` |

### 5.3 Issues

| Hook | Purpose | Query / mutation |
|------|----------|-------------------|
| **useTeamIssues** | Issues for team (with tab filter) | GraphQL `TeamIssues` |
| **useMyIssues** | Issues assigned to current user | GraphQL `MyIssues` |
| **useUpdateIssue** | Update issue (e.g. status) | REST `PATCH .../issues/:id` |

### 5.4 Inbox & nav

| Hook | Purpose | Query / mutation |
|------|----------|-------------------|
| **useInbox** | Notifications for current user | GraphQL `Inbox` |
| **useNavTeams** | Teams for navbar/team switcher | GraphQL `NavTeams` |

---

## 6. Summary Table

| Screen / area | GraphQL (GET) | REST (POST/PATCH/DELETE) |
|---------------|----------------|---------------------------|
| Workspace Projects | WorkspaceProjects | — |
| Workspace Teams | WorkspaceTeams | — |
| Workspace Members | WorkspaceMembers | Invite member |
| Workspace Views | WorkspaceViews | — |
| Workspace Roles | WorkspaceRoles | — |
| Inbox | Inbox / notifications | Optional: mark read |
| My Issues | MyIssues | — |
| Team Projects | TeamProjectPage, StatusUpdateComments | Post update, Post comment, Update project, Milestones CRUD |
| Team Issues | TeamIssues | Update issue |
| Team Views | TeamViews | — |
| Team Logs | TeamLogs | — |
| Nav / layout | NavTeams | — |

---

## 7. File Structure (suggested)

```
src/
  api/                    # optional: graphql + rest client config
    graphql.ts
    rest.ts
  services/
    workspaceService.ts
    projectService.ts
    issueService.ts
    teamService.ts
    inboxService.ts
    viewService.ts
  hooks/
    useWorkspaceProjects.ts
    useWorkspaceTeams.ts
    useWorkspaceMembers.ts
    useInviteMember.ts
    useWorkspaceViews.ts
    useWorkspaceRoles.ts
    useTeam.ts
    useTeamProject.ts
    useStatusUpdateComments.ts
    usePostStatusUpdate.ts
    usePostStatusComment.ts
    useUpdateProject.ts
    useCreateMilestone.ts
    useUpdateMilestone.ts
    useTeamViews.ts
    useTeamLogs.ts
    useTeamIssues.ts
    useMyIssues.ts
    useUpdateIssue.ts
    useInbox.ts
    useNavTeams.ts
  graphql/
    queries/
      workspace.projects.gql
      workspace.teams.gql
      workspace.members.gql
      workspace.views.gql
      workspace.roles.gql
      team.project.gql
      team.issues.gql
      team.views.gql
      team.logs.gql
      me.inbox.gql
      me.myIssues.gql
      me.navTeams.gql
    # or single operations file
```

This spec can be implemented incrementally: start with one screen (e.g. Workspace Projects or Team Projects), add its GraphQL query + REST calls, one service, and one or two hooks, then wire the screen to the hooks.
