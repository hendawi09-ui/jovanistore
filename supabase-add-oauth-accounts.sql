-- دعم تسجيل الدخول بجوجل/فيسبوك: حساب ممكن يتعمل بإيميل بس (بدون رقم موبايل أو باسورد في البداية)
alter table customers alter column phone drop not null;
alter table customers alter column password_hash drop not null;
alter table customers add column if not exists email text unique;
alter table customers add column if not exists oauth_login_token text;
alter table customers add column if not exists oauth_login_token_expires timestamptz;
