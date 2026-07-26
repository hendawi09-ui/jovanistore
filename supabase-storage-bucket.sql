-- شغّل الكود ده في Supabase SQL Editor لإنشاء مكان تخزين الصور

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;
