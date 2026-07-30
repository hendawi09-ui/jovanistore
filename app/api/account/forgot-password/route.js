import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { sendPasswordResetEmail } from "@/lib/notify";
import crypto from "crypto";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const identifier = String(body.identifier || "").trim();
  if (!identifier) {
    return NextResponse.json({ error: "اكتب رقم موبايلك أو إيميلك" }, { status: 400 });
  }

  const isEmail = identifier.includes("@");
  const phone = identifier.replace(/\D/g, "");

  let query = supabase.from("customers").select("*");
  query = isEmail ? query.eq("email", identifier) : query.eq("phone", phone);
  const { data: customer } = await query.maybeSingle();

  // ردّ موحّد دايمًا سواء الحساب موجود أو لأ — عشان محدش يعرف الأرقام/الإيميلات المسجّلة عندنا
  const genericOk = NextResponse.json({
    ok: true,
    message: "لو الحساب موجود، هيوصلك إيميل فيه رابط إعادة التعيين.",
  });

  if (!customer || !customer.email) return genericOk;

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // ساعة واحدة

  const { error } = await supabase
    .from("customers")
    .update({ reset_token: token, reset_token_expires: expires })
    .eq("id", customer.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const origin = req.nextUrl.origin;
  const resetUrl = `${origin}/account/reset-password?token=${token}`;
  await sendPasswordResetEmail(customer.email, resetUrl, customer.name);

  return genericOk;
}
