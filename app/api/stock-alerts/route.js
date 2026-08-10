import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

// عام — الزبون بيسجّل رقمه عشان نعرّفه لما المقاس يرجع يتوفر
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const productId = body.productId;
  const phone = String(body.phone || "").replace(/\D/g, "");
  const size = String(body.size || "").trim();
  const email = String(body.email || "").trim();

  if (!productId) {
    return NextResponse.json({ error: "المنتج غير محدد" }, { status: 400 });
  }
  if (phone.length < 10) {
    return NextResponse.json({ error: "من فضلك اكتب رقم موبايل صحيح" }, { status: 400 });
  }

  // لو نفس الرقم مسجّل قبل كده لنفس المقاس، مش بنكرر
  const { data: existing } = await supabase
    .from("stock_alerts")
    .select("id")
    .eq("product_id", productId)
    .eq("phone", phone)
    .eq("size", size || "")
    .eq("notified", false)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, already: true });
  }

  const { error } = await supabase.from("stock_alerts").insert([
    {
      product_id: productId,
      product_name: body.productName || null,
      phone,
      email: email || null,
      size: size || "",
      color: body.color || null,
    },
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// محمي — لوحة التحكم بتشوف الطلبات المسجّلة
export async function GET() {
  const { data, error } = await supabase
    .from("stock_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// محمي — تعليم الطلب كـ"تم التواصل"
export async function PATCH(req) {
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  const { error } = await supabase
    .from("stock_alerts")
    .update({ notified: true, notified_at: new Date().toISOString() })
    .eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
