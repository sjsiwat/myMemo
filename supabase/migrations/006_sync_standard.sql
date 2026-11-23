-- ============================================================
-- Migration 006: Standard Offline-First & Realtime Sync
-- Run this in Supabase SQL Editor
--
-- 1. Adds `updated_at` to tasks, notes, expenses (idempotent).
-- 2. Attaches a BEFORE UPDATE trigger so updates from ANY client
--    (Web App, LIFF Worker, LINE Bot) refresh `updated_at` automatically.
-- 3. Enables Supabase Realtime (`supabase_realtime` publication) on
--    tasks, notes, expenses so changes propagate live across devices.
--
-- Backward-compatible with `server/worker.js` and `johny-line-bot`.
-- ============================================================

-- 1. Add updated_at column to tasks, notes, expenses
alter table public.tasks
  add column if not exists updated_at timestamptz not null default now();

alter table public.notes
  add column if not exists updated_at timestamptz not null default now();

alter table public.expenses
  add column if not exists updated_at timestamptz not null default now();

-- Indexes to speed up ordered/delta queries per user
create index if not exists tasks_user_updated_idx    on public.tasks(user_id, updated_at desc);
create index if not exists notes_user_updated_idx    on public.notes(user_id, updated_at desc);
create index if not exists expenses_user_updated_idx on public.expenses(user_id, updated_at desc);

-- 2. Shared trigger to keep updated_at fresh on every UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  -- Preserve client-supplied updated_at only if it is explicitly newer;
  -- otherwise stamp server now() so updates from LIFF / LINE Bot always advance.
  if new.updated_at is null or new.updated_at = old.updated_at then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists trg_notes_updated_at on public.notes;
create trigger trg_notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- 3. Enable Supabase Realtime on tasks, notes, expenses (idempotent)
-- REPLICA IDENTITY FULL ensures DELETE events include `user_id` in WAL so
-- Realtime `filter: user_id=eq.<uid>` and RLS deliver DELETEs to other devices.
alter table public.tasks    replica identity full;
alter table public.notes    replica identity full;
alter table public.expenses replica identity full;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['tasks', 'notes', 'expenses'] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;
