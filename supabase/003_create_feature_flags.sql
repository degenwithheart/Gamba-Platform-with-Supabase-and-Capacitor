-- 003_create_feature_flags.sql
create table if not exists feature_flags (
  key text primary key,
  value boolean not null default false,
  updated_at timestamptz default now()
);
