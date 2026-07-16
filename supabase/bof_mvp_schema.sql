-- BOF MVP Supabase starter schema
-- Run this in Supabase SQL Editor before switching the demo fully to Supabase data.

create table if not exists public.bof_public_operations_dataset (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.bof_public_operations_dataset enable row level security;

drop policy if exists "BOF public demo dataset can be read" on public.bof_public_operations_dataset;
create policy "BOF public demo dataset can be read"
on public.bof_public_operations_dataset
for select
to anon, authenticated
using (id = 'current');

drop policy if exists "BOF authenticated users can manage demo dataset" on public.bof_public_operations_dataset;
create policy "BOF authenticated users can manage demo dataset"
on public.bof_public_operations_dataset
for all
to authenticated
using (true)
with check (true);

create or replace function public.touch_bof_public_operations_dataset()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_bof_public_operations_dataset on public.bof_public_operations_dataset;
create trigger touch_bof_public_operations_dataset
before update on public.bof_public_operations_dataset
for each row
execute function public.touch_bof_public_operations_dataset();

-- Optional normalized MVP tables can come next. The public site currently reads the
-- single canonical JSON payload above so we can move safely from static JSON to
-- Supabase without breaking the existing pages.
