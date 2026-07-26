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
  if (typeof body.name === "string") update.name = body.name;
  if (typeof body.desc === "string") update.description = body.desc;
  if (typeof body.price !== "undefined") update.price = Number(body.price);
  if (typeof body.cat === "string") update.cat = body.cat;
  if (typeof body.icon === "string") update.icon = body.icon;
  if (typeof body.published === "boolean") update.published = body.published;

  if (Array.isArray(body.images)) {
    const images = body.images.filter(Boolean);
    update.image_urls = images.length > 0 ? images : null;
    update.image_url = images[0] || null;
  }
  if (Array.isArray(body.colors)) {
    const colors = body.colors.filter(Boolean);
    update.colors = colors.length > 0 ? colors : null;
  }
  if (Array.isArray(body.sizes)) {
    const sizes = body.sizes.filter(Boolean);
    update.sizes = sizes.length > 0 ? sizes : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "لا يوجد حقل صالح للتحديث" }, { status: 400 });
  }

  const { error } = await supabase.from("products").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
