import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

// بيرجع أكتر المنتجات مبيعًا — بيحسبها من الطلبات الفعلية (مجموع الكميات المباعة).
// الطلبات الملغية مش بتتحسب، عشان الأرقام تبقى حقيقية.
export async function GET() {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("items, status");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // بنجمع الكميات المباعة لكل منتج
  const soldCount = new Map();
  for (const order of orders || []) {
    if (order.status === "cancelled") continue;
    for (const item of order.items || []) {
      if (!item.productId) continue;
      soldCount.set(item.productId, (soldCount.get(item.productId) || 0) + (item.qty || 0));
    }
  }

  if (soldCount.size === 0) return NextResponse.json([]);

  // بنجيب بيانات المنتجات دي
  const ids = [...soldCount.keys()];
  const { data: rows, error: pErr } = await supabase
    .from("products")
    .select("*")
    .in("id", ids);

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const list = (rows || [])
    .filter((r) => r.published !== false)
    .map((r) => ({ id: r.id, sold: soldCount.get(r.id) || 0 }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 8);

  return NextResponse.json(list);
}
