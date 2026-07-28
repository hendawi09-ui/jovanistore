import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PATCH(req, { params }) {
  const body = await req.json();
  const update = {};
  if (typeof body.active === "boolean") update.active = body.active;
  if (typeof body.value !== "undefined") update.value = Number(body.value);
  if (body.type === "percent" || body.type === "fixed") update.type = body.type;
  if ("expires_at" in body) update.expires_at = body.expires_at || null;
  if ("max_uses" in body) update.max_uses = body.max_uses ? Number(body.max_uses) : null;
  if ("min_total" in body) update.min_total = body.min_total ? Number(body.min_total) : null;
  if ("min_items" in body) update.min_items = body.min_items ? Number(body.min_items) : null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "لا يوجد حقل صالح للتحديث" }, { status: 400 });
  }

  const { error } = await supabase.from("coupons").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const { error } = await supabase.from("coupons").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
