-- Rename issues.date to issues.due_date for clarity.
-- Note: application code must read/write `due_date` after this migration.

alter table public.issues
rename column date to due_date;

