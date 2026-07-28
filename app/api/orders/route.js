import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { notifyNewOrder } from "@/lib/notify";
import { stockKey } from "@/lib/products";
import { validateCoupon } from "@/lib/coupons";

export async function GET() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// بينقص الكمية من المخزون لكل منتج في الطلب
async function decrementStock(items) {
  const ids = [...new Set((items || []).map((i) => i.productId).filter(Boolean))];
  if (ids.length === 0) return;

  const { data: rows, error } = await supabase.from("products").select("id, stock").in("id", ids);
  if (error || !rows) return;

  for (const row of rows) {
    if (!row.stock || typeof row.stock !== "object") continue; // المخزون غير مُفعّل لهذا المنتج
    const next = { ...row.stock };
    let changed = false;

    for (const item of items) {
      if (item.productId !== row.id) continue;
      const key = stockKey(item.color || "", item.size || "");
      if (typeof next[key] === "number") {
        next[key] = Math.max(0, next[key] - (item.qty || 0));
        changed = true;
      }
    }

    if (changed) {
      await supabase.from("products").update({ stock: next }).eq("id", row.id);
    }
  }
}

export async function POST(req) {
  const order = await req.json();

  // إعادة التحقق من الكوبون على السيرفر (منعًا للتلاعب من المتصفح)
  if (order.coupon_code) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", order.coupon_code)
      .maybeSingle();

    const subtotal = Number(order.subtotal) || 0;
    const itemCount = (order.items || []).reduce((s, i) => s + (i.qty || 0), 0);
    const result = validateCoupon(coupon, { subtotal, itemCount });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // نعتمد الخصم المحسوب على السيرفر بدل اللي جاي من المتصفح
    order.discount = result.discount;
    order.total = Math.max(0, subtotal - result.discount) + (Number(order.shipping) || 0);

    await supabase
      .from("coupons")
      .update({ uses: (coupon.uses || 0) + 1 })
      .eq("id", coupon.id);
  }

  const { data, error } = await supabase.from("orders").insert([order]).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await decrementStock(order.items);
  } catch (e) {
    console.error("decrementStock failed:", e);
  }

  try {
    await notifyNewOrder(order);
  } catch (e) {
    console.error("notifyNewOrder failed:", e);
  }

  return NextResponse.json(data[0]);
}
