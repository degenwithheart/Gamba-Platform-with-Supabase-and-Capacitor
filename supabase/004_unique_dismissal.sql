-- 004_unique_dismissal.sql
alter table if exists announcement_dismissals
  add constraint if not exists unique_user_announcement unique (user_id, announcement_id);
