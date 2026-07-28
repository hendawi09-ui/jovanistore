import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();
  const code = String(body.code || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "كود الخصم مطلوب" }, { status: 400 });

  const type = body.type === "fixed" ? "fixed" : "percent";
  const value = Number(body.value);
  if (!value || value <= 0) return NextResponse.json({ error: "قيمة الخصم غير صحيحة" }, { status: 400 });
  if (type === "percent" && value > 100) {
    return NextResponse.json({ error: "نسبة الخصم لا يمكن أن تتجاوز 100%" }, { status: 400 });
  }

  const row = {
    code,
    type,
    value,
    expires_at: body.expires_at || null,
    max_uses: body.max_uses ? Number(body.max_uses) : null,
    min_total: body.min_total ? Number(body.min_total) : null,
    min_items: body.min_items ? Number(body.min_items) : null,
    active: body.active !== false,
  };

  const { data, error } = await supabase.from("coupons").insert([row]).select();
  if (error) {
    const msg = error.code === "23505" ? "هذا الكود موجود بالفعل" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json(data[0]);
}
