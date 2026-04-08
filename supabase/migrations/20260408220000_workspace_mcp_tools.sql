-- Workspace mapping for external MCP tools (IntegrationBits)

create table if not exists public.workspace_mcp_tools (
  id uuid primary key default gen_random_uuid(),
  -- Workbit workspace ids are string (e.g. "ws-1"), not uuid.
  workspace_id text not null,
  tool_key text not null,
  enabled boolean not null default false,
  base_url text,
  access_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists workspace_mcp_tools_workspace_tool_key_uidx
  on public.workspace_mcp_tools (workspace_id, tool_key);

create index if not exists workspace_mcp_tools_workspace_id_idx
  on public.workspace_mcp_tools (workspace_id);

create index if not exists workspace_mcp_tools_tool_key_idx
  on public.workspace_mcp_tools (tool_key);

alter table public.workspace_mcp_tools enable row level security;

-- Keep it simple for now: only service role accesses this table via the API.
-- (Add admin/member policies when needed.)

