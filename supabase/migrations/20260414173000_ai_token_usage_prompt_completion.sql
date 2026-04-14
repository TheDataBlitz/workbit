-- Track prompt vs completion token usage per AI request.
-- Backwards compatible: existing rows get defaults.

alter table public.ai_token_usage
  add column if not exists prompt_tokens integer not null default 0 check (prompt_tokens >= 0),
  add column if not exists completion_tokens integer not null default 0 check (completion_tokens >= 0);

comment on column public.ai_token_usage.prompt_tokens is 'Provider-reported input/prompt tokens for the request (may be 0 when unknown).';
comment on column public.ai_token_usage.completion_tokens is 'Provider-reported output/completion tokens for the request (may be 0 when unknown).';

