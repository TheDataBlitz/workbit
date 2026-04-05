-- Enabled AI agent keys per project (catalog keys validated in application code).

create table if not exists public.project_agents (
  project_id text not null references public.projects (id) on delete cascade,
  agent_key text not null,
  created_at timestamptz not null default now(),
  primary key (project_id, agent_key)
);

create index if not exists project_agents_project_id_idx
  on public.project_agents (project_id);

notify pgrst, 'reload schema';
