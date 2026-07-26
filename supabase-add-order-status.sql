-- شغّل الكود ده في Supabase SQL Editor

alter table orders add column if not exists status text default 'pending';
update orders set status = 'pending' where status is null;
