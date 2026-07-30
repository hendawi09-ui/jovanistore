import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { hashPassword } from "@/lib/auth";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone || "").replace(/\D/g, "");
  const password = String(body.password || "");

  if (!phone || phone.length < 8) {
    return NextResponse.json({ error: "رقم الموبايل غير صحيح" }, { status: 400 });
  }
  if (!password || password.length < 4) {
    return NextResponse.json({ error: "كلمة السر لازم تكون 4 حروف أو أرقام على الأقل" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "الرقم ده مسجّل بحساب بالفعل، جرّب تسجّل دخول" }, { status: 409 });
  }

  const password_hash = hashPassword(password);
  const { data, error } = await supabase
    .from("customers")
    .insert([{ phone, password_hash }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    phone: data.phone,
    name: data.name || "",
    city: data.city || "",
    address: data.address || "",
    email: data.email || "",
  });
}
