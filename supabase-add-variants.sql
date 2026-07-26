-- شغّل الكود ده في Supabase SQL Editor

alter table products add column if not exists colors jsonb;
alter table products add column if not exists sizes jsonb;
