-- Allow issues to be created without a team (team_id optional).
alter table public.issues
  alter column team_id drop not null;
