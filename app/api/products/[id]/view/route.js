import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// تسجيل زيارة لمنتج معيّن — بيزوّد عداد views بواحد في قاعدة البيانات
export async function POST(req, { params }) {
  const { error } = await supabase.rpc("increment_product_views", {
    pid: params.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
