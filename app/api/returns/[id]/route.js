import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const VALID = ["new", "approved", "rejected", "done"];

// محمي — تحديث حالة طلب الاسترجاع من لوحة التحكم
export async function PATCH(req, { params }) {
  const body = await req.json();
  const update = {};
  if ("status" in body) {
    if (!VALID.includes(body.status)) {
      return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
    }
    update.status = body.status;
  }
  if ("adminNote" in body) update.admin_note = String(body.adminNote || "").slice(0, 1000);

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "لا يوجد حقل للتحديث" }, { status: 400 });
  }

  const { error } = await supabase.from("return_requests").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// محمي — حذف طلب
export async function DELETE(req, { params }) {
  const { error } = await supabase.from("return_requests").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
