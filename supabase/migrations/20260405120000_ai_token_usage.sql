-- AI token usage: one row per model round / request aggregate, tagged by shop (tenant) and user.
-- 1 Intelebit = 100 tokens (see generated column intelebits).
-- IF NOT EXISTS: safe to re-run if the table was created manually or a previous apply stopped mid-file.

create table if not exists public.ai_token_usage (
  id uuid primary key default gen_random_uuid(),
  shop_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  tokens integer not null check (tokens >= 0),
  intelebits numeric(20, 6) generated always as ((tokens::numeric / 100)) stored,
  consumed_at timestamptz not null default now()
);

create index if not exists ai_token_usage_shop_consumed_at_idx
  on public.ai_token_usage (shop_id, consumed_at desc);

create index if not exists ai_token_usage_user_consumed_at_idx
  on public.ai_token_usage (user_id, consumed_at desc);

comment on table public.ai_token_usage is 'LLM token spend per request; shop_id is tenant key (e.g. workspace).';

alter table public.ai_token_usage enable row level security;

-- Efficient rolling-window sum for rate limiting (service role / RPC).
create or replace function public.sum_ai_token_usage_for_shop_since(
  p_shop_id text,
  p_since timestamptz
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(u.tokens), 0)::bigint
  from public.ai_token_usage u
  where u.shop_id = p_shop_id
    and u.consumed_at >= p_since;
$$;

revoke all on function public.sum_ai_token_usage_for_shop_since(text, timestamptz) from public;
grant execute on function public.sum_ai_token_usage_for_shop_since(text, timestamptz) to service_role;
