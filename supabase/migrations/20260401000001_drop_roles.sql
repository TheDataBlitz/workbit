-- Drop workspace roles feature (table + invitation role reference).
-- This migration is destructive; ensure API/UI no longer reads these first.

alter table if exists public.invitations
  drop column if exists role_id;

drop table if exists public.roles;

