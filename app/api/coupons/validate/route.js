import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { validateCoupon, couponLabel } from "@/lib/coupons";

export async function POST(req) {
  const body = await req.json();
  const code = String(body.code || "").trim().toUpperCase();
  const subtotal = Number(body.subtotal) || 0;
  const itemCount = Number(body.itemCount) || 0;

  if (!code) return NextResponse.json({ ok: false, error: "أدخل كود الخصم" }, { status: 400 });

  const { data, error } = await supabase.from("coupons").select("*").eq("code", code).maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const result = validateCoupon(data, { subtotal, itemCount });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  return NextResponse.json({
    ok: true,
    code,
    discount: result.discount,
    label: couponLabel(data),
  });
}
