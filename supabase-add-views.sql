-- إضافة عمود عدد الزيارات لكل منتج
alter table products add column if not exists views integer not null default 0;

-- دالة تزوّد عداد الزيارات لمنتج معيّن بواحد (بأمان، بدون تعارض بين طلبين في نفس اللحظة)
create or replace function increment_product_views(pid bigint)
returns void as $$
begin
  update products set views = views + 1 where id = pid;
end;
$$ language plpgsql;
