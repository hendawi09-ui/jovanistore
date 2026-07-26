-- شغّل الكود ده في Supabase SQL Editor

alter table products add column if not exists sort_order integer;

-- يحدد ترتيب مبدئي لنفس ترتيب المنتجات الحالي
update products set sort_order = id where sort_order is null;
