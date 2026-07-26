-- شغّل الكود ده في Supabase SQL Editor

alter table products add column if not exists published boolean default true;
update products set published = true where published is null;
