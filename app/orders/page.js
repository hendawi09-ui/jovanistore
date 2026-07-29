"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/StoreContext";
import { showToast } from "@/components/Toast";

const STATUS = {
  pending: { label: "قيد الانتظار", cls: "st-pending" },
  confirmed: { label: "تم التأكيد", cls: "st-confirmed" },
  shipped: { label: "تم الشحن", cls: "st-shipped" },
  delivered: { label: "تم التسليم", cls: "st-delivered" },
  cancelled: { label: "ملغي", cls: "st-cancelled" },
};

export default function OrdersPage() {
  const { orders, cancelOrder } = useStore();
  const [confirmId, setConfirmId] = useState(null); // الطلب اللي بيستنى تأكيد الإلغاء
  const [busy, setBusy] = useState(false);

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        لا توجد طلبات سابقة بعد.<br /><br />
        <Link href="/" className="btn-primary">ابدأ التسوّق</Link>
      </div>
    );
  }

  async function doCancel(order) {
    setBusy(true);
    const { ok, error } = await cancelOrder(order.id, order.phone);
    setBusy(false);
    setConfirmId(null);
    showToast(ok ? "تم إلغاء طلبك" : error || "تعذّر إلغاء الطلب");
  }

  return (
    <div className="orders-wrap">
      <div className="section-head" style={{ margin: "0 0 24px", padding: 0 }}><h2>طلباتي</h2></div>
      {orders.map((o) => {
        const status = o.status || "pending";
        const info = STATUS[status] || STATUS.pending;
        const canCancel = status === "pending";

        return (
          <div className="order-card" key={o.id}>
            <div className="order-top">
              <strong>طلب #{o.id}</strong>
              <span className={`badge ${info.cls}`}>{info.label}</span>
            </div>
            <div className="order-items">{o.items.map((i) => `${i.name} × ${i.qty}`).join("، ")}</div>
            <div className="order-items">
              {o.date} — التوصيل إلى {o.city} — {o.pay === "cod" ? "الدفع عند الاستلام" : "بطاقة (تجريبي)"}
            </div>
            <div className="order-total">{o.total} ج.م</div>

            {canCancel && confirmId !== o.id && (
              <button className="cancel-order-btn" onClick={() => setConfirmId(o.id)}>
                إلغاء الطلب
              </button>
            )}

            {canCancel && confirmId === o.id && (
              <div className="cancel-confirm">
                <span>متأكد إنك عايز تلغي الطلب ده؟ الإجراء ده نهائي.</span>
                <div className="cancel-actions">
                  <button className="cancel-yes" disabled={busy} onClick={() => doCancel(o)}>
                    {busy ? "جارِ الإلغاء..." : "نعم، ألغِ الطلب"}
                  </button>
                  <button className="cancel-no" disabled={busy} onClick={() => setConfirmId(null)}>
                    تراجع
                  </button>
                </div>
              </div>
            )}

            {!canCancel && status !== "cancelled" && (
              <div className="order-note">
                تم تأكيد الطلب — للإلغاء أو التعديل تواصل معنا عبر{" "}
                <Link href="/policies#contact">صفحة التواصل</Link>.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
