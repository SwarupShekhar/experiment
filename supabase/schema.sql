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
create table if not exists public.sessions (
  id uuid primary key,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cond jsonb not null default '{}'::jsonb,
  furthest_idx smallint not null default 0,
  furthest_scene text not null default '',
  total smallint not null default 0,
  finished boolean not null default false
);
alter table public.sessions enable row level security;
revoke all on table public.sessions from anon, authenticated;
create index if not exists sessions_started_idx on public.sessions (started_at desc);

create or replace function public.track_progress(p_id uuid, p_idx int, p_scene text, p_total int, p_cond jsonb, p_finished boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_idx not between 0 and 200 or char_length(p_scene) > 40 or p_total not between 1 and 200
     or octet_length(coalesce(p_cond,'{}')::text) > 500 then return; end if;
  insert into public.sessions (id, cond, furthest_idx, furthest_scene, total, finished)
  values (p_id, coalesce(p_cond,'{}'), p_idx, p_scene, p_total, coalesce(p_finished,false))
  on conflict (id) do update set
    furthest_idx = greatest(public.sessions.furthest_idx, excluded.furthest_idx),
    furthest_scene = case when excluded.furthest_idx >= public.sessions.furthest_idx then excluded.furthest_scene else public.sessions.furthest_scene end,
    finished = public.sessions.finished or excluded.finished,
    updated_at = now();
end $$;
revoke all on function public.track_progress(uuid, int, text, int, jsonb, boolean) from public;
grant execute on function public.track_progress(uuid, int, text, int, jsonb, boolean) to anon, service_role;

-- Drop-off funnel for the site owner (run in SQL editor): how many sessions reached each scene.
create or replace view public.funnel with (security_invoker = on) as
  select furthest_scene as scene, furthest_idx as idx, count(*) as stopped_here,
         sum(count(*)) over (order by furthest_idx desc) as reached
  from public.sessions group by furthest_scene, furthest_idx order by furthest_idx;
revoke all on public.funnel from anon, authenticated;
