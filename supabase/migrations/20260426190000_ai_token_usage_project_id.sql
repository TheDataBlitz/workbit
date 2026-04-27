-- Attribute token usage to a project when available.
-- Backwards compatible: existing rows remain null.

alter table public.ai_token_usage
  add column if not exists project_id text null;

create index if not exists ai_token_usage_project_consumed_at_idx
  on public.ai_token_usage (project_id, consumed_at desc);

comment on column public.ai_token_usage.project_id is 'Optional: project id (when the AI request was project-scoped).';

notify pgrst, 'reload schema';

