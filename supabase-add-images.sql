-- شغّل هذا الكود في Supabase SQL Editor

alter table products add column if not exists image_url text;

update products set image_url = 'https://placehold.co/600x600/0D0D0D/FFFFFF?text=Men+Shirt' where name = 'قميص كتان كلاسيك';
update products set image_url = 'https://placehold.co/600x600/0D0D0D/FFFFFF?text=Men+Jacket' where name = 'جاكيت جينز أزرق';
update products set image_url = 'https://placehold.co/600x600/0D0D0D/FFFFFF?text=Men+Pants' where name = 'بنطلون قماش رمادي';
update products set image_url = 'https://placehold.co/600x600/E31B23/FFFFFF?text=Women+Dress' where name = 'فستان صيفي مزهّر';
update products set image_url = 'https://placehold.co/600x600/E31B23/FFFFFF?text=Women+Blouse' where name = 'بلوزة حرير وردية';
update products set image_url = 'https://placehold.co/600x600/E31B23/FFFFFF?text=Women+Skirt' where name = 'تنورة بليه صفراء';
update products set image_url = 'https://placehold.co/600x600/E31B23/FFFFFF?text=Women+Top' where name = 'بلوزة أكمام واسعة';
