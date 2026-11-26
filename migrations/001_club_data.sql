create table if not exists club_data (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
