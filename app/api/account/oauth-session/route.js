import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.login_token || "");
  if (!token) return NextResponse.json({ error: "رمز الدخول مفقود" }, { status: 400 });

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("oauth_login_token", token)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!customer) return NextResponse.json({ error: "رمز الدخول غير صالح" }, { status: 404 });

  if (customer.oauth_login_token_expires && new Date(customer.oauth_login_token_expires) < new Date()) {
    return NextResponse.json({ error: "انتهت صلاحية رابط الدخول، حاول تاني" }, { status: 410 });
  }

  // إبطال الرمز بعد استخدامه مرة واحدة عشان محدش يقدر يستخدمه تاني
  await supabase
    .from("customers")
    .update({ oauth_login_token: null, oauth_login_token_expires: null })
    .eq("id", customer.id);

  return NextResponse.json({
    phone: customer.phone || "",
    name: customer.name || "",
    city: customer.city || "",
    address: customer.address || "",
    email: customer.email || "",
  });
}
