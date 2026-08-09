import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const KEY = "store_mode";
const VALID = ["all", "women", "men"];

const noCache = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

// عام — الواجهة بتقراها عشان تعرف تعرض إيه
export async function GET() {
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .eq("key", KEY)
    .maybeSingle();

  const raw = data?.value ?? null;
  const mode = VALID.includes(raw) ? raw : "all";

  return NextResponse.json({ mode }, { headers: noCache });
}

// محمي — التبديل من لوحة التحكم
export async function PUT(req) {
  const body = await req.json().catch(() => ({}));
  const mode = String(body.mode || "");

  if (!VALID.includes(mode)) {
    return NextResponse.json({ error: "قيمة غير صالحة" }, { status: 400, headers: noCache });
  }

  const { data, error } = await supabase
    .from("site_settings")
    .upsert({ key: KEY, value: mode }, { onConflict: "key" })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noCache });
  }

  // بنتأكد إن الكتابة حصلت فعلًا — لو مرجعتش صف، يبقى فيه مشكلة صلاحيات
  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "الحفظ مرجعش أي صف — يرجّح إن فيه مشكلة صلاحيات على جدول site_settings" },
      { status: 500, headers: noCache }
    );
  }

  return NextResponse.json({ ok: true, mode: data[0].value }, { headers: noCache });
}
