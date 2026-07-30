import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { hashPassword } from "@/lib/auth";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token || "");
  const newPassword = String(body.newPassword || "");

  if (!token) return NextResponse.json({ error: "رابط غير صالح" }, { status: 400 });
  if (!newPassword || newPassword.length < 4) {
    return NextResponse.json({ error: "كلمة السر لازم تكون 4 حروف أو أرقام على الأقل" }, { status: 400 });
  }

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("reset_token", token)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!customer) {
    return NextResponse.json({ error: "الرابط غير صالح أو تم استخدامه قبل كده" }, { status: 404 });
  }

  if (customer.reset_token_expires && new Date(customer.reset_token_expires) < new Date()) {
    return NextResponse.json({ error: "انتهت صلاحية الرابط، اطلب واحد جديد" }, { status: 410 });
  }

  // تغيير كلمة السر وإبطال الرمز فورًا عشان ما يتستخدمش تاني
  const { error: upErr } = await supabase
    .from("customers")
    .update({
      password_hash: hashPassword(newPassword),
      reset_token: null,
      reset_token_expires: null,
    })
    .eq("id", customer.id);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
