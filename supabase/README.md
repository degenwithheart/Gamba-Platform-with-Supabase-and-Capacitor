Supabase migrations for Gamba platform

Files:
- 001_create_announcements.sql
- 002_create_announcement_dismissals.sql
- 003_create_feature_flags.sql
- 004_create_profiles.sql

How to apply
1) Using the Supabase SQL editor: open the SQL editor and run each file in order.
2) Using supabase-cli (if available):
   supabase db reset (or follow your normal migration process)

Example inserts
-- add a default announcement
insert into announcements (title, body, active) values ('Welcome!', 'Welcome to our test platform — enjoy responsibly', true);

-- add a feature flag
insert into feature_flags (key, value) values ('ENABLE_CACHE_SYSTEM', true) on conflict (key) do update set value = excluded.value;

Notes
- If you are using Row Level Security (RLS), allow read access to `feature_flags` and `announcements` for anon users, or use the public endpoints provided under `api/public/` which read via the anon key.
- The admin endpoints require `x-admin-key` header that matches `ADMIN_API_KEY` configured on the server.
