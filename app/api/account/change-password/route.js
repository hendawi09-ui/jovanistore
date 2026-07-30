import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { hashPassword, verifyPassword } from "@/lib/auth";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone || "").replace(/\D/g, "");
  const email = String(body.email || "").trim();
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (!phone && !email) {
    return NextResponse.json({ error: "بيانات الحساب مفقودة" }, { status: 400 });
  }
  if (!newPassword || newPassword.length < 4) {
    return NextResponse.json({ error: "كلمة السر الجديدة لازم تكون 4 حروف أو أرقام على الأقل" }, { status: 400 });
  }

  let query = supabase.from("customers").select("*");
  query = email ? query.eq("email", email) : query.eq("phone", phone);
  const { data: customer, error } = await query.maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!customer) return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 });

  // الحسابات اللي اتعملت بجوجل/فيسبوك ممكن ماتكونش عندها كلمة سر أصلًا،
  // فبنطلب الحالية بس لو فيه واحدة متسجّلة
  if (customer.password_hash) {
    if (!currentPassword) {
      return NextResponse.json({ error: "اكتب كلمة السر الحالية" }, { status: 400 });
    }
    if (!verifyPassword(currentPassword, customer.password_hash)) {
      return NextResponse.json({ error: "كلمة السر الحالية غير صحيحة" }, { status: 401 });
    }
  }

  const { error: upErr } = await supabase
    .from("customers")
    .update({ password_hash: hashPassword(newPassword) })
    .eq("id", customer.id);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, hadPassword: Boolean(customer.password_hash) });
}
