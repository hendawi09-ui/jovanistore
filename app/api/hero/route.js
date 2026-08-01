import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

function toClient(row) {
  return {
    id: row.id,
    image: row.image_url || null,
    title: row.title || "",
    description: row.description || "",
    ctaLabel: row.cta_label || "",
    ctaLink: row.cta_link || "#",
    badge: row.badge || null,
    sortOrder: row.sort_order,
    published: row.published !== false,
  };
}

async function readHeroEnabled() {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "hero_enabled")
    .maybeSingle();
  // لو الصف مش موجود لأي سبب، الافتراضي إن السلايدر شغّال
  return data?.value !== "false";
}

// عام — بتستخدمها الصفحة الرئيسية لعرض السلايدر
export async function GET() {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enabled = await readHeroEnabled();
  return NextResponse.json({ enabled, slides: data.map(toClient) });
}

// محمي — تشغيل/إلغاء السلايدر كله من لوحة التحكم
export async function PATCH(req) {
  const body = await req.json();
  if (!("enabled" in body)) {
    return NextResponse.json({ error: "لا يوجد حقل صالح للتحديث" }, { status: 400 });
  }
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "hero_enabled", value: body.enabled ? "true" : "false" }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, enabled: !!body.enabled });
}

// محمي — إضافة سلايد جديد من لوحة التحكم
export async function POST(req) {
  const body = await req.json();

  const { data: maxRow } = await supabase
    .from("hero_slides")
    .select("sort_order")
    .order("sort_order", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order || 0) + 1;

  const { data, error } = await supabase
    .from("hero_slides")
    .insert([
      {
        image_url: body.image || null,
        title: body.title || "",
        description: body.description || "",
        cta_label: body.ctaLabel || "",
        cta_link: body.ctaLink || "#",
        badge: body.badge || null,
        sort_order: nextOrder,
        published: true,
      },
    ])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toClient(data));
}
