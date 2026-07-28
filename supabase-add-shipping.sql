-- شغّل الكود ده في Supabase SQL Editor

alter table orders add column if not exists shipping numeric default 0;
