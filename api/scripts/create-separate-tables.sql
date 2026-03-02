-- Create separate tables for projects, teams, members, roles, etc.
-- Run this in Supabase Dashboard → SQL Editor (replaces single store blob).
-- Then run: cd api && npm run seed

-- Tables
create table if not exists public.projects (
  id text primary key,
  name text not null,
  team_id text not null,
  status text not null default 'Active'
);
create table if not exists public.teams (
  id text primary key,
  name text not null,
  project_id text,
  member_ids jsonb not null default '[]'::jsonb
);
create table if not exists public.members (
  id text primary key,
  name text not null,
  username text not null,
  avatar_src text,
  status text not null,
  joined text not null,
  team_ids jsonb not null default '[]'::jsonb
);
create table if not exists public.views (
  id text primary key,
  name text not null,
  type text not null,
  owner_id text not null,
  team_id text
);
create table if not exists public.roles (
  id text primary key,
  role text not null,
  member_count int not null default 0,
  description text not null default ''
);
create table if not exists public.invitations (
  id text primary key,
  email text not null,
  role_id text,
  created_at timestamptz not null default now()
);
create table if not exists public.status_updates (
  id text primary key,
  team_id text not null,
  status text not null,
  content text not null,
  author_id text not null,
  author_name text not null,
  author_avatar_src text,
  created_at timestamptz not null,
  comment_count int not null default 0
);
create table if not exists public.status_update_comments (
  id text primary key,
  update_id text not null,
  author_name text not null,
  author_avatar_src text,
  content text not null,
  timestamp timestamptz not null
);
create table if not exists public.project_properties (
  team_id text primary key,
  status text not null default 'planned',
  priority text not null default 'high',
  lead_id text,
  start_date text,
  end_date text,
  team_ids jsonb not null default '[]'::jsonb,
  label_ids jsonb not null default '[]'::jsonb
);
create table if not exists public.milestones (
  id text primary key,
  team_id text not null,
  name text not null,
  progress int not null default 0,
  total int not null default 0,
  target_date text not null default '',
  description text
);
create table if not exists public.activity (
  id text primary key,
  team_id text not null,
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
  team_id text,
  project_id text
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
alter table public.teams enable row level security;
alter table public.members enable row level security;
alter table public.views enable row level security;
alter table public.roles enable row level security;
alter table public.invitations enable row level security;
alter table public.status_updates enable row level security;
alter table public.status_update_comments enable row level security;
alter table public.project_properties enable row level security;
alter table public.milestones enable row level security;
alter table public.activity enable row level security;
alter table public.issues enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "projects_service_role" on public.projects;
create policy "projects_service_role" on public.projects for all using (true) with check (true);
drop policy if exists "teams_service_role" on public.teams;
create policy "teams_service_role" on public.teams for all using (true) with check (true);
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
drop policy if exists "status_update_comments_service_role" on public.status_update_comments;
create policy "status_update_comments_service_role" on public.status_update_comments for all using (true) with check (true);
drop policy if exists "project_properties_service_role" on public.project_properties;
create policy "project_properties_service_role" on public.project_properties for all using (true) with check (true);
drop policy if exists "milestones_service_role" on public.milestones;
create policy "milestones_service_role" on public.milestones for all using (true) with check (true);
drop policy if exists "activity_service_role" on public.activity;
create policy "activity_service_role" on public.activity for all using (true) with check (true);
drop policy if exists "issues_service_role" on public.issues;
create policy "issues_service_role" on public.issues for all using (true) with check (true);
drop policy if exists "notifications_service_role" on public.notifications;
create policy "notifications_service_role" on public.notifications for all using (true) with check (true);
