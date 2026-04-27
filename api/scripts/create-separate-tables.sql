-- Create separate tables for workspaces, projects, members, roles, etc.
-- Run this in Supabase Dashboard → SQL Editor (replaces single store blob).
-- Then run: cd api && npm run seed

-- Tables
create table if not exists public.projects (
  id text primary key,
  name text not null,
  workspace_id text not null,
  status text not null default 'Active'
);
create table if not exists public.members (
  id text primary key,
  name text not null,
  username text not null,
  avatar_src text,
  status text not null,
  joined text not null
);
create table if not exists public.views (
  id text primary key,
  name text not null,
  type text not null,
  owner_id text not null,
  workspace_id text
);
create table if not exists public.invitations (
  id text primary key,
  email text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.status_updates (
  id text primary key,
  status text not null,
  content text not null,
  author_id text not null,
  author_name text not null,
  author_avatar_src text,
  created_at timestamptz not null,
  comment_count int not null default 0,
  project_id text,
  issue_id text
);
create table if not exists public.comments (
  id text primary key,
  entity_id text,
  comment_text text not null,
  comment_date timestamptz not null default now(),
  comment_author text not null,
  comment_author_avatar text,
  parent_comment_id text references public.comments (id) on delete cascade,
  likes integer not null default 0 check (likes >= 0),
  mention_author_ids text[] not null default '{}',
  comment_options jsonb not null default '{"hideReplies": false, "hideLikes": false}'::jsonb,
  constraint comments_comment_options_shape check (
    jsonb_typeof(comment_options) = 'object'
    and comment_options ? 'hideReplies'
    and comment_options ? 'hideLikes'
    and jsonb_typeof(comment_options -> 'hideReplies') = 'boolean'
    and jsonb_typeof(comment_options -> 'hideLikes') = 'boolean'
  )
);
create table if not exists public.project_properties (
  project_id text primary key,
  status text not null default 'planned',
  priority text not null default 'high',
  lead_id text,
  start_date text,
  end_date text,
  member_ids jsonb not null default '[]'::jsonb,
  label_ids jsonb not null default '[]'::jsonb
);
create table if not exists public.activity (
  id text primary key,
  project_id text not null,
  icon text not null,
  message text not null,
  date text not null
);
create table if not exists public.issues (
  id text primary key,
  title text not null,
  assignee_id text,
  assignee_name text,
  date text not null,
  status text not null,
  project_id text not null
);
create table if not exists public.decisions (
  id text primary key,
  project_id text not null,
  title text not null,
  type text not null,
  rationale text not null,
  impact text,
  tags text[] not null default '{}',
  created_by_id text not null,
  created_by_name text not null,
  decision_date text,
  status text not null,
  linked_milestone_ids text[] not null default '{}',
  linked_issue_ids text[] not null default '{}',
  created_at timestamptz not null,
  updated_at timestamptz not null
);
create table if not exists public.notifications (
  id text primary key,
  type text not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null,
  actor_id text not null,
  actor_name text not null,
  target_url text
);

-- RLS
alter table public.projects enable row level security;
alter table public.members enable row level security;
alter table public.views enable row level security;
alter table public.roles enable row level security;
alter table public.invitations enable row level security;
alter table public.status_updates enable row level security;
alter table public.comments enable row level security;
alter table public.project_properties enable row level security;
alter table public.activity enable row level security;
alter table public.issues enable row level security;
alter table public.decisions enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "projects_service_role" on public.projects;
create policy "projects_service_role" on public.projects for all using (true) with check (true);
drop policy if exists "members_service_role" on public.members;
create policy "members_service_role" on public.members for all using (true) with check (true);
drop policy if exists "views_service_role" on public.views;
create policy "views_service_role" on public.views for all using (true) with check (true);
drop policy if exists "roles_service_role" on public.roles;
create policy "roles_service_role" on public.roles for all using (true) with check (true);
drop policy if exists "invitations_service_role" on public.invitations;
create policy "invitations_service_role" on public.invitations for all using (true) with check (true);
drop policy if exists "status_updates_service_role" on public.status_updates;
create policy "status_updates_service_role" on public.status_updates for all using (true) with check (true);
drop policy if exists "comments_service_role" on public.comments;
create policy "comments_service_role" on public.comments for all using (true) with check (true);
drop policy if exists "project_properties_service_role" on public.project_properties;
create policy "project_properties_service_role" on public.project_properties for all using (true) with check (true);
drop policy if exists "activity_service_role" on public.activity;
create policy "activity_service_role" on public.activity for all using (true) with check (true);
drop policy if exists "issues_service_role" on public.issues;
create policy "issues_service_role" on public.issues for all using (true) with check (true);
drop policy if exists "decisions_service_role" on public.decisions;
create policy "decisions_service_role" on public.decisions for all using (true) with check (true);
drop policy if exists "notifications_service_role" on public.notifications;
create policy "notifications_service_role" on public.notifications for all using (true) with check (true);
