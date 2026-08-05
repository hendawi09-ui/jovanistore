import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { logStockMoves, readStockMoves } from "@/lib/stockLog";

export const dynamic = "force-dynamic";

// قراءة سجل حركة المخزون
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const limit = Number(searchParams.get("limit")) || 100;

  const { moves, error } = await readStockMoves({ limit, productId });
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(moves);
}

// تعديل كمية مقاس معيّن — بيسجّل الحركة تلقائيًا
// body: { productId, variantKey, newQty, note }
export async function PATCH(req) {
  const body = await req.json().catch(() => ({}));
  const { productId, variantKey, newQty, note } = body;

  if (!productId || typeof variantKey !== "string") {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const qty = Math.max(0, Number(newQty) || 0);

  const { data: row, error } = await supabase
    .from("products")
    .select("id, name, stock")
    .eq("id", productId)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
  }

  const current = row.stock && typeof row.stock === "object" ? { ...row.stock } : {};
  const before = typeof current[variantKey] === "number" ? current[variantKey] : 0;

  if (before === qty) return NextResponse.json({ ok: true, unchanged: true });

  current[variantKey] = qty;

  const { error: upErr } = await supabase
    .from("products")
    .update({ stock: current })
    .eq("id", productId);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  await logStockMoves([
    {
      productId,
      productName: row.name,
      variantKey,
      change: qty - before,
      before,
      after: qty,
      type: qty > before ? "restock" : "adjustment",
      note: note || null,
    },
  ]);

  return NextResponse.json({ ok: true, before, after: qty });
}
