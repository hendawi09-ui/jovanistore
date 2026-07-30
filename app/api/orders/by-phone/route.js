import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// إرجاع كل طلبات عميل معيّن بناءً على رقم موبايله.
// ملحوظة: ده حساب بسيط حاليًا بدون كود تحقق (OTP) — أي حد يعرف الرقم يقدر يشوف الطلبات المرتبطة بيه.
// المفروض يترقّى لاحقًا لتحقق حقيقي (SMS) لما القرار ده يتاخد.
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone || "").replace(/\D/g, "");
  if (!phone) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const matched = (data || []).filter(
    (o) => String(o.phone || "").replace(/\D/g, "") === phone
  );
  return NextResponse.json(matched);
}
