-- شغّل الكود ده في Supabase SQL Editor

alter table products add column if not exists stock jsonb;
