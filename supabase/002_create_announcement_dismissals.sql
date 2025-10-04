-- 002_create_announcement_dismissals.sql
create table if not exists announcement_dismissals (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  announcement_id uuid not null references announcements(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_announcement_dismissals_user on announcement_dismissals(user_id);
