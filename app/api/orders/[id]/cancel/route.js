import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { stockKey } from "@/lib/products";
import { notifyCancelledOrder } from "@/lib/notify";

// بيرجّع الكميات للمخزون بعد إلغاء الطلب
async function restoreStock(items) {
  const ids = [...new Set((items || []).map((i) => i.productId).filter(Boolean))];
  if (ids.length === 0) return;

  const { data: rows, error } = await supabase.from("products").select("id, stock").in("id", ids);
  if (error || !rows) return;

  for (const row of rows) {
    if (!row.stock || typeof row.stock !== "object") continue;
    const next = { ...row.stock };
    let changed = false;

    for (const item of items) {
      if (item.productId !== row.id) continue;
      const key = stockKey(item.color || "", item.size || "");
      if (typeof next[key] === "number") {
        next[key] = next[key] + (item.qty || 0);
        changed = true;
      }
    }

    if (changed) await supabase.from("products").update({ stock: next }).eq("id", row.id);
  }
}

export async function POST(req, { params }) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone || "").replace(/\D/g, "");

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  // إثبات ملكية بسيط: رقم الموبايل لازم يطابق اللي في الطلب
  const orderPhone = String(order.phone || "").replace(/\D/g, "");
  if (!phone || phone !== orderPhone) {
    return NextResponse.json({ error: "بيانات غير مطابقة لهذا الطلب" }, { status: 403 });
  }

  const status = order.status || "pending";
  if (status === "cancelled") {
    return NextResponse.json({ error: "هذا الطلب ملغي بالفعل" }, { status: 400 });
  }
  if (status !== "pending") {
    return NextResponse.json(
      { error: "لا يمكن إلغاء الطلب بعد تأكيده. تواصل معنا للمساعدة." },
      { status: 400 }
    );
  }

  const { error: upErr } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", params.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  try {
    await restoreStock(order.items);
  } catch (e) {
    console.error("restoreStock failed:", e);
  }

  try {
    await notifyCancelledOrder(order);
  } catch (e) {
    console.error("notifyCancelledOrder failed:", e);
  }

  return NextResponse.json({ ok: true });
}
