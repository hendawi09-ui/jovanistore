import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import crypto from "crypto";

export async function GET(req) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/orders?oauth_error=1`);

  const redirectUri = `${origin}/api/auth/callback/google`;

  // استبدال الكود بتوكن دخول من جوجل
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return NextResponse.redirect(`${origin}/orders?oauth_error=1`);

  // جلب بيانات العميل من جوجل
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json();
  const email = profile.email;
  const name = profile.name || "";

  if (!email) return NextResponse.redirect(`${origin}/orders?oauth_error=1`);

  // البحث عن حساب موجود بنفس الإيميل، أو إنشاء واحد جديد
  let { data: customer } = await supabase.from("customers").select("*").eq("email", email).maybeSingle();
  if (!customer) {
    const { data: created, error } = await supabase
      .from("customers")
      .insert([{ email, name }])
      .select()
      .single();
    if (error) return NextResponse.redirect(`${origin}/orders?oauth_error=1`);
    customer = created;
  }

  // توكن دخول قصير الأجل يستخدمه المتصفح مرة واحدة بس لتفعيل الجلسة
  const loginToken = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await supabase
    .from("customers")
    .update({ oauth_login_token: loginToken, oauth_login_token_expires: expires })
    .eq("id", customer.id);

  return NextResponse.redirect(`${origin}/account/oauth-complete?login_token=${loginToken}`);
}
