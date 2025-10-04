-- Run in Supabase SQL editor

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Keep updated_at in sync
create or replace function public.handle_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_profiles_updated_at on public.profiles;
create trigger on_profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_profiles_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;

-- Policies: users can read all profiles
create policy "Profiles are readable by everyone"
on public.profiles for select
using (true);

-- Users can insert their own profile
create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Social Features Tables
-- =====================

-- Friends/Followers system
create table if not exists public.user_relationships (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('follow', 'friend')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(follower_id, following_id)
);

-- Chat messages (global trollbox)
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  channel text not null default 'global',
  reply_to uuid references public.chat_messages(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Direct messages
create table if not exists public.direct_messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  read_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  check (sender_id != recipient_id)
);

-- User stats for enhanced leaderboards
create table if not exists public.user_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  total_wagered decimal(20,8) default 0,
  total_winnings decimal(20,8) default 0,
  games_played integer default 0,
  biggest_win decimal(20,8) default 0,
  biggest_loss decimal(20,8) default 0,
  last_played_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, game_id)
);

-- Triggers for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_user_relationships_updated_at on public.user_relationships;
create trigger on_user_relationships_updated_at
  before update on public.user_relationships
  for each row execute function public.handle_updated_at();

drop trigger if exists on_chat_messages_updated_at on public.chat_messages;
create trigger on_chat_messages_updated_at
  before update on public.chat_messages
  for each row execute function public.handle_updated_at();

drop trigger if exists on_user_stats_updated_at on public.user_stats;
create trigger on_user_stats_updated_at
  before update on public.user_stats
  for each row execute function public.handle_updated_at();

-- Row Level Security Policies
-- ==========================

-- User Relationships
alter table public.user_relationships enable row level security;

create policy "Users can view relationships involving them"
on public.user_relationships for select
using (follower_id = auth.uid() or following_id = auth.uid());

create policy "Users can create relationships as follower"
on public.user_relationships for insert
with check (follower_id = auth.uid());

create policy "Users can update their own relationship requests"
on public.user_relationships for update
using (follower_id = auth.uid() or following_id = auth.uid())
with check (follower_id = auth.uid() or following_id = auth.uid());

create policy "Users can delete their own relationships"
on public.user_relationships for delete
using (follower_id = auth.uid() or following_id = auth.uid());

-- Chat Messages (Global - readable by all authenticated users)
alter table public.chat_messages enable row level security;

create policy "Authenticated users can read global chat"
on public.chat_messages for select
using (auth.role() = 'authenticated');

create policy "Authenticated users can send messages"
on public.chat_messages for insert
with check (auth.uid() = user_id);

create policy "Users can update their own messages"
on public.chat_messages for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Direct Messages
alter table public.direct_messages enable row level security;

create policy "Users can read their own DMs"
on public.direct_messages for select
using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "Users can send DMs"
on public.direct_messages for insert
with check (sender_id = auth.uid());

create policy "Users can update their received DMs (mark as read)"
on public.direct_messages for update
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

-- User Stats (readable by all, updatable by system/owner)
alter table public.user_stats enable row level security;

create policy "User stats are readable by everyone"
on public.user_stats for select
using (true);

create policy "Users can insert their own stats"
on public.user_stats for insert
with check (user_id = auth.uid());

create policy "Users can update their own stats"
on public.user_stats for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Indexes for performance
create index if not exists idx_user_relationships_follower on public.user_relationships(follower_id);
create index if not exists idx_user_relationships_following on public.user_relationships(following_id);
create index if not exists idx_chat_messages_channel on public.chat_messages(channel, created_at desc);
create index if not exists idx_direct_messages_conversation on public.direct_messages(sender_id, recipient_id, created_at desc);
create index if not exists idx_user_stats_user_game on public.user_stats(user_id, game_id);
create index if not exists idx_user_stats_leaderboard on public.user_stats(game_id, total_wagered desc, created_at desc);

-- Function to update user stats (for game tracking)
CREATE OR REPLACE FUNCTION update_user_stats(
  p_user_id UUID,
  p_game_id TEXT,
  p_wagered DECIMAL(20,8),
  p_winnings DECIMAL(20,8),
  p_biggest_win DECIMAL(20,8) DEFAULT 0,
  p_biggest_loss DECIMAL(20,8) DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_stats (
    user_id, 
    game_id, 
    total_wagered, 
    total_winnings, 
    games_played,
    biggest_win,
    biggest_loss,
    last_played_at
  )
  VALUES (
    p_user_id,
    p_game_id,
    p_wagered,
    p_winnings,
    1,
    GREATEST(p_biggest_win, p_winnings),
    GREATEST(p_biggest_loss, CASE WHEN p_winnings < 0 THEN ABS(p_winnings) ELSE 0 END),
    NOW()
  )
  ON CONFLICT (user_id, game_id) DO UPDATE SET
    total_wagered = user_stats.total_wagered + p_wagered,
    total_winnings = user_stats.total_winnings + p_winnings,
    games_played = user_stats.games_played + 1,
    biggest_win = GREATEST(user_stats.biggest_win, p_biggest_win, p_winnings),
    biggest_loss = GREATEST(user_stats.biggest_loss, p_biggest_loss, CASE WHEN p_winnings < 0 THEN ABS(p_winnings) ELSE 0 END),
    last_played_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;