import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PATCH(req) {
  const body = await req.json().catch(() => ({}));
  const currentPhone = String(body.currentPhone || "").replace(/\D/g, "");
  const currentEmail = String(body.currentEmail || "").trim();

  if (!currentPhone && !currentEmail) {
    return NextResponse.json({ error: "بيانات الحساب مفقودة" }, { status: 400 });
  }

  const update = {};
  if (typeof body.name === "string") update.name = body.name.trim();
  if (typeof body.city === "string") update.city = body.city.trim();
  if (typeof body.address === "string") update.address = body.address.trim();
  if (typeof body.phone === "string" && body.phone.trim()) {
    update.phone = body.phone.replace(/\D/g, "");
  }
  // الإيميل اختياري — بيستخدم في استرجاع كلمة السر
  if (typeof body.email === "string") {
    const em = body.email.trim();
    update.email = em === "" ? null : em;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "لا يوجد بيانات للتحديث" }, { status: 400 });
  }

  let query = supabase.from("customers").update(update);
  query = currentEmail ? query.eq("email", currentEmail) : query.eq("phone", currentPhone);

  const { data, error } = await query.select().maybeSingle();

  if (error) {
    if (error.message && error.message.includes("duplicate key")) {
      const field = error.message.includes("email") ? "الإيميل" : "رقم الموبايل";
      return NextResponse.json({ error: `${field} ده مستخدم بحساب تاني بالفعل` }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 });

  return NextResponse.json({
    phone: data.phone || "",
    name: data.name || "",
    city: data.city || "",
    address: data.address || "",
    email: data.email || "",
  });
}
