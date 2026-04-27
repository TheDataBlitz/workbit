-- Remove team abstraction: workspaces -> projects -> issues
-- NOTE: This is destructive. Apply only after deploying API code that no longer depends on teams.

-- 1) Projects belong to a workspace (not a team)
alter table public.projects
  add column if not exists workspace_id text;

-- Backfill workspace_id using the old team relation if present.
do $$
begin
  if to_regclass('public.teams') is not null then
    update public.projects p
    set workspace_id = t.workspace_id
    from public.teams t
    where p.workspace_id is null
      and p.team_id = t.id;
  end if;
end $$;

-- Fall back to a default workspace if still null (matches existing seed id).
update public.projects
set workspace_id = 'ws-1'
where workspace_id is null;

alter table public.projects
  alter column workspace_id set not null;

alter table public.projects
  drop column if exists team_id;

create index if not exists idx_projects_workspace_id on public.projects (workspace_id);

-- 2) Issues belong to a project (team_id removed)
-- Backfill project_id from old team -> project mapping
do $$
begin
  if to_regclass('public.teams') is not null then
    update public.issues i
    set project_id = t.project_id
    from public.teams t
    where i.project_id is null
      and i.team_id = t.id
      and t.project_id is not null
      and t.project_id != '';
  end if;
end $$;

alter table public.issues
  drop column if exists team_id;

-- 3) Status updates no longer have team_id; they are scoped by project_id and/or issue_id
-- Backfill project_id from issue if needed.
update public.status_updates su
set project_id = i.project_id
from public.issues i
where su.project_id is null
  and su.issue_id = i.id
  and i.project_id is not null
  and i.project_id != '';

alter table public.status_updates
  drop column if exists team_id;

-- 4) Project properties keyed by project_id (not team_id)
alter table public.project_properties
  add column if not exists project_id text;

-- Backfill project_id from team -> project mapping where possible.
do $$
begin
  if to_regclass('public.teams') is not null then
    update public.project_properties pp
    set project_id = t.project_id
    from public.teams t
    where pp.project_id is null
      and pp.team_id = t.id
      and t.project_id is not null
      and t.project_id != '';
  end if;
end $$;

-- Drop team-related columns used only by the team abstraction.
alter table public.project_properties
  drop column if exists team_ids;

-- Re-key to project_id.
do $$
begin
  -- Drop old PK if it exists (by convention it will be project_properties_pkey).
  if exists (
    select 1 from pg_constraint
    where conname = 'project_properties_pkey'
      and conrelid = 'public.project_properties'::regclass
  ) then
    alter table public.project_properties drop constraint project_properties_pkey;
  end if;
end $$;

alter table public.project_properties
  drop column if exists team_id;

alter table public.project_properties
  alter column project_id set not null;

alter table public.project_properties
  add primary key (project_id);

-- 5) Activity keyed by project_id (not team_id)
alter table public.activity
  add column if not exists project_id text;

do $$
begin
  if to_regclass('public.teams') is not null then
    update public.activity a
    set project_id = t.project_id
    from public.teams t
    where a.project_id is null
      and a.team_id = t.id
      and t.project_id is not null
      and t.project_id != '';
  end if;
end $$;

alter table public.activity
  drop column if exists team_id;

create index if not exists idx_activity_project_id on public.activity (project_id);

-- 6) Views are no longer team-scoped
do $$
begin
  if to_regclass('public.views') is not null then
    execute 'alter table public.views drop column if exists team_id';
  end if;
end $$;

-- 7) Members are no longer team-scoped
do $$
begin
  if to_regclass('public.members') is not null then
    execute 'alter table public.members drop column if exists team_ids';
  end if;
end $$;

-- 8) Remaining team-scoped tables are dropped
drop table if exists public.teams;
drop table if exists public.milestones;
