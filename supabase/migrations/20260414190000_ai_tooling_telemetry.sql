-- AI tooling telemetry for internal monitoring dashboards.
-- Retention target: 7 days (cleanup function provided; schedule externally).

create table if not exists public.ai_tooling_requests (
  id uuid primary key default gen_random_uuid(),
  shop_id text not null,
  user_id uuid null references auth.users (id) on delete set null,
  project_id uuid null,

  provider text not null default 'nvidia_nim',
  model text null,
  agent_key text null,
  router_fallback boolean not null default false,

  selection_mode text not null default 'fallback_all'
    check (selection_mode in ('none', 'selected', 'bucketed', 'fallback_all')),
  selection_tokens integer not null default 0 check (selection_tokens >= 0),

  tools_total_count integer not null default 0 check (tools_total_count >= 0),
  tools_selected_count integer not null default 0 check (tools_selected_count >= 0),
  tools_payload_bytes integer not null default 0 check (tools_payload_bytes >= 0),

  tool_rounds integer not null default 0 check (tool_rounds >= 0),
  total_tokens integer not null default 0 check (total_tokens >= 0),
  prompt_tokens integer not null default 0 check (prompt_tokens >= 0),
  completion_tokens integer not null default 0 check (completion_tokens >= 0),

  created_at timestamptz not null default now()
);

create index if not exists ai_tooling_requests_shop_created_at_idx
  on public.ai_tooling_requests (shop_id, created_at desc);

create index if not exists ai_tooling_requests_created_at_idx
  on public.ai_tooling_requests (created_at desc);

create index if not exists ai_tooling_requests_agent_created_at_idx
  on public.ai_tooling_requests (agent_key, created_at desc);

create index if not exists ai_tooling_requests_model_created_at_idx
  on public.ai_tooling_requests (model, created_at desc);

comment on table public.ai_tooling_requests is 'Internal telemetry: one row per /api/v1/ai request (tool selection + total tokens).';

alter table public.ai_tooling_requests enable row level security;

create table if not exists public.ai_tooling_rounds (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.ai_tooling_requests (id) on delete cascade,
  round_index integer not null check (round_index >= 0),

  tools_selected_count integer not null default 0 check (tools_selected_count >= 0),
  tools_payload_bytes integer not null default 0 check (tools_payload_bytes >= 0),
  tool_calls_count integer not null default 0 check (tool_calls_count >= 0),

  total_tokens integer not null default 0 check (total_tokens >= 0),
  prompt_tokens integer not null default 0 check (prompt_tokens >= 0),
  completion_tokens integer not null default 0 check (completion_tokens >= 0),

  created_at timestamptz not null default now()
);

create unique index if not exists ai_tooling_rounds_request_round_idx
  on public.ai_tooling_rounds (request_id, round_index);

create index if not exists ai_tooling_rounds_request_created_at_idx
  on public.ai_tooling_rounds (request_id, created_at desc);

create index if not exists ai_tooling_rounds_created_at_idx
  on public.ai_tooling_rounds (created_at desc);

create index if not exists ai_tooling_rounds_shop_created_at_idx
  on public.ai_tooling_rounds (created_at desc, request_id);

comment on table public.ai_tooling_rounds is 'Internal telemetry: one row per NIM round within a request.';

alter table public.ai_tooling_rounds enable row level security;

-- Cleanup helper for 7-day retention; schedule externally (Supabase dashboard, cron, etc).
create or replace function public.delete_ai_tooling_telemetry_before(
  p_cutoff timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.ai_tooling_rounds r
  using public.ai_tooling_requests req
  where r.request_id = req.id
    and req.created_at < p_cutoff;

  delete from public.ai_tooling_requests
  where created_at < p_cutoff;
end;
$$;

revoke all on function public.delete_ai_tooling_telemetry_before(timestamptz) from public;
grant execute on function public.delete_ai_tooling_telemetry_before(timestamptz) to service_role;

