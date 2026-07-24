"use client";
import Link from "next/link";
import { useStore } from "@/lib/StoreContext";

export default function OrdersPage() {
  const { orders } = useStore();

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        لا توجد طلبات سابقة بعد.<br /><br />
        <Link href="/" className="btn-primary">ابدأ التسوّق</Link>
      </div>
    );
  }

  return (
    <div className="orders-wrap">
      <div className="section-head" style={{ margin: "0 0 24px", padding: 0 }}><h2>طلباتي</h2></div>
      {orders.map((o) => (
        <div className="order-card" key={o.id}>
          <div className="order-top"><strong>طلب #{o.id}</strong><span className="badge">قيد التنفيذ</span></div>
          <div className="order-items">{o.items.map((i) => `${i.name} × ${i.qty}`).join("، ")}</div>
          <div className="order-items">{o.date} — التوصيل إلى {o.city} — {o.pay === "cod" ? "الدفع عند الاستلام" : "بطاقة (تجريبي)"}</div>
          <div className="order-total">{o.total} ج.م</div>
        </div>
      ))}
    </div>
  );
}
