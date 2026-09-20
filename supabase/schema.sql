-- Block 9 database. Already applied to the Supabase project "block9" (ref xchvvotvkmurtrynafat).
-- To recreate elsewhere: Supabase → SQL Editor → paste → Run.
create table if not exists public.runs (
  id uuid primary key,
  created_at timestamptz not null default now(),
  mode text not null check (mode in ('solo', 'party')),
  cond jsonb not null default '{}'::jsonb,
  archetype text not null check (char_length(archetype) < 40),
  corruption smallint not null check (corruption between 0 and 100),
  pct jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  duration_ms integer,
  order_score smallint,
  delete_token_hash text not null
);
create index if not exists runs_created_at_idx on public.runs (created_at desc);
-- Table is locked: RLS on, no policies, no grants. Access only via the functions below.
alter table public.runs enable row level security;
revoke all on table public.runs from anon, authenticated;

create or replace function public.submit_run(
  p_id uuid, p_mode text, p_cond jsonb, p_archetype text, p_corruption int,
  p_pct jsonb, p_answers jsonb, p_duration int, p_order int, p_token_hash text
) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if p_mode not in ('solo','party') or p_corruption not between 0 and 100
     or char_length(p_archetype) >= 40 or char_length(p_token_hash) <> 64
     or octet_length(coalesce(p_answers,'{}')::text) > 20000
     or octet_length(coalesce(p_cond,'{}')::text) > 2000
     or octet_length(coalesce(p_pct,'{}')::text) > 2000 then
    return false;
  end if;
  insert into public.runs (id, mode, cond, archetype, corruption, pct, answers, duration_ms, order_score, delete_token_hash)
  values (p_id, p_mode, coalesce(p_cond,'{}'), p_archetype, p_corruption, coalesce(p_pct,'{}'), coalesce(p_answers,'{}'),
          case when p_duration between 0 and 100000000 then p_duration end,
          case when p_order between 0 and 100 then p_order end, p_token_hash)
  on conflict (id) do nothing;
  return found;
end $$;

create or replace function public.remove_run(p_id uuid, p_token_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  delete from public.runs where id = p_id and delete_token_hash = p_token_hash;
  return found;
end $$;

-- Returns anonymous game data only (no ids, no tokens).
create or replace function public.recent_runs(p_limit int default 5000)
returns table (mode text, cond jsonb, archetype text, corruption smallint, pct jsonb, answers jsonb)
language sql security definer set search_path = '' stable as $$
  select r.mode, r.cond, r.archetype, r.corruption, r.pct, r.answers
  from public.runs r order by r.created_at desc limit least(greatest(p_limit, 1), 5000);
$$;

revoke all on function public.submit_run(uuid, text, jsonb, text, int, jsonb, jsonb, int, int, text) from public;
revoke all on function public.remove_run(uuid, text) from public;
revoke all on function public.recent_runs(int) from public;
grant execute on function public.submit_run(uuid, text, jsonb, text, int, jsonb, jsonb, int, int, text) to anon, service_role;
grant execute on function public.remove_run(uuid, text) to anon, service_role;
grant execute on function public.recent_runs(int) to anon, service_role;
