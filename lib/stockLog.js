import { supabase } from "@/lib/supabaseClient";

// أنواع الحركة
// sale        = بيع (خصم تلقائي عند تأكيد طلب)
// restock     = إضافة كمية (توريد جديد)
// adjustment  = تسوية يدوية (جرد، تالف، مرتجع... إلخ)
// return      = رجوع كمية للمخزون بعد استرجاع

// بيسجّل حركة واحدة أو أكتر. الفشل هنا مش بيوقف العملية الأصلية —
// السجل مهم لكن مش أهم من إن الطلب نفسه يتم بنجاح.
export async function logStockMoves(moves) {
  if (!Array.isArray(moves) || moves.length === 0) return;
  try {
    await supabase.from("stock_moves").insert(
      moves.map((m) => ({
        product_id: m.productId,
        product_name: m.productName || null,
        variant_key: m.variantKey || "|",
        change: m.change,          // موجب = زيادة، سالب = نقص
        before_qty: m.before ?? null,
        after_qty: m.after ?? null,
        move_type: m.type || "adjustment",
        note: m.note || null,
        order_id: m.orderId || null,
      }))
    );
  } catch {
    /* السجل مش حرج — منوقفش العملية الأصلية لو فشل */
  }
}

// بيقرأ آخر الحركات (للعرض في لوحة التحكم)
export async function readStockMoves({ limit = 100, productId = null } = {}) {
  let q = supabase
    .from("stock_moves")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (productId) q = q.eq("product_id", productId);

  const { data, error } = await q;
  if (error) return { error: error.message, moves: [] };
  return { moves: data || [] };
}
