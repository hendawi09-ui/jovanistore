import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function DELETE(req, { params }) {
  const { error } = await supabase.from("products").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req, { params }) {
  const body = await req.json();
  const update = {};
  if (typeof body.sort_order === "number") update.sort_order = body.sort_order;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "لا يوجد حقل صالح للتحديث" }, { status: 400 });
  }

  const { error } = await supabase.from("products").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
