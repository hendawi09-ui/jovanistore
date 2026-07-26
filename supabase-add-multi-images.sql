-- شغّل الكود ده في Supabase SQL Editor

alter table products add column if not exists image_urls jsonb;

-- ينقل أي صورة موجودة بالفعل (من العمود القديم image_url) لتكون أول صورة في القائمة الجديدة
update products
set image_urls = jsonb_build_array(image_url)
where image_url is not null and image_urls is null;
