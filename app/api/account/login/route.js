import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { verifyPassword } from "@/lib/auth";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone || "").replace(/\D/g, "");
  const password = String(body.password || "");

  if (!phone || !password) {
    return NextResponse.json({ error: "من فضلك اكتب رقم الموبايل وكلمة السر" }, { status: 400 });
  }

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!customer) return NextResponse.json({ error: "مفيش حساب بهذا الرقم" }, { status: 404 });

  const ok = verifyPassword(password, customer.password_hash);
  if (!ok) return NextResponse.json({ error: "كلمة السر غير صحيحة" }, { status: 401 });

  return NextResponse.json({
    phone: customer.phone,
    name: customer.name || "",
    city: customer.city || "",
    address: customer.address || "",
    email: customer.email || "",
  });
}
