import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

const KEY = "store_mode";
const VALID = ["all", "women", "men"];

// عام — الواجهة بتقراها عشان تعرف تعرض إيه
export async function GET() {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", KEY)
    .maybeSingle();

  const mode = VALID.includes(data?.value) ? data.value : "all";
  // من غير تخزين مؤقت — أي تبديل من لوحة التحكم بيبان للزوار فورًا
  return NextResponse.json({ mode }, {
    headers: { "Cache-Control": "no-store" },
  });
}

// محمي — التبديل من لوحة التحكم
export async function PUT(req) {
  const body = await req.json().catch(() => ({}));
  const mode = String(body.mode || "");

  if (!VALID.includes(mode)) {
    return NextResponse.json({ error: "قيمة غير صالحة" }, { status: 400 });
  }

  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: KEY, value: mode }, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, mode });
}
