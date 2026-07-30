-- أعمدة رمز إعادة تعيين كلمة السر (صالح لمدة ساعة، ويُستخدم مرة واحدة بس)
alter table customers add column if not exists reset_token text;
alter table customers add column if not exists reset_token_expires timestamptz;
