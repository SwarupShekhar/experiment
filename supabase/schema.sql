-- Block 9: anonymous game runs.
-- Run this once in the Supabase SQL editor (Project → SQL → New query).
create table if not exists public.runs (
  id uuid primary key,
  created_at timestamptz not null default now(),
  mode text not null check (mode in ('solo', 'party')),
  cond jsonb not null default '{}'::jsonb,
  archetype text not null,
  corruption smallint not null check (corruption between 0 and 100),
  pct jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  duration_ms integer,
  order_score smallint,
  delete_token_hash text not null
);

create index if not exists runs_created_at_idx on public.runs (created_at desc);

-- Row level security ON with no policies: the public anon key can read/write
-- nothing. Only the server (service role key, used in /api/runs) touches this table.
alter table public.runs enable row level security;

-- Realtime for party rooms uses Broadcast + Presence channels only,
-- which need no tables. Make sure Realtime is enabled for the project
-- (it is by default).
