-- شغّل الكود ده في Supabase SQL Editor

-- كل لون بقى منتج مستقل بصفحته الخاصة.
-- المنتجات اللي ليها نفس group_key بتعتبر ألوان لنفس القطعة.
alter table products add column if not exists group_key text;
alter table products add column if not exists color_name text;

create index if not exists products_group_key_idx on products (group_key);
