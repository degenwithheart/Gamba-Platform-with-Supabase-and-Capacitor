-- 001_create_announcements.sql
create table if not exists announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text not null,
  active boolean default true,
  created_at timestamptz default now()
);
