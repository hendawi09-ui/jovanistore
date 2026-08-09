import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// محمي — تعديل سلايد (نص، صورة، ترتيب، نشر/إخفاء)
export async function PATCH(req, { params }) {
  const body = await req.json();
  const update = {};
  if ("image" in body) update.image_url = body.image || null;
  if ("cat" in body) update.cat = body.cat || "all";
  if ("imageMobile" in body) update.image_mobile_url = body.imageMobile || null;
  if ("title" in body) update.title = body.title || "";
  if ("description" in body) update.description = body.description || "";
  if ("ctaLabel" in body) update.cta_label = body.ctaLabel || "";
  if ("ctaLink" in body) update.cta_link = body.ctaLink || "#";
  if ("badge" in body) update.badge = body.badge || null;
  if ("published" in body) update.published = !!body.published;
  if ("sortOrder" in body) update.sort_order = Number(body.sortOrder);

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "لا يوجد حقل صالح للتحديث" }, { status: 400 });
  }

  const { error } = await supabase.from("hero_slides").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// محمي — حذف سلايد نهائيًا
export async function DELETE(req, { params }) {
  const { error } = await supabase.from("hero_slides").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
