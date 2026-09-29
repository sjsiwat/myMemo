-- ============================================================
-- Migration: Incomes table for Memo+ LIFF
-- Run this in Supabase SQL Editor
-- ============================================================

create table if not exists public.incomes (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  title       text        not null,
  amount      numeric     not null check (amount >= 0),
  category    text        not null default 'อื่นๆ',
  date        date        not null default current_date,
  created_at  timestamptz not null default now()
);

alter table public.incomes enable row level security;

-- Authenticated users can manage only their own incomes
create policy "Users manage own incomes"
  on public.incomes for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists incomes_user_id_idx on public.incomes(user_id);
create index if not exists incomes_date_idx on public.incomes(date desc);
