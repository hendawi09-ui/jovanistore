"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { showToast } from "@/components/Toast";

const STATUS_LABELS = {
  pending: "قيد الانتظار",
  confirmed: "تم التأكيد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

function dayKey(iso) {
  if (!iso) return "unknown";
  return new Date(iso).toISOString().slice(0, 10);
}

function dayLabel(iso) {
  if (!iso) return "تاريخ غير معروف";
  return new Date(iso).toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function timeLabel(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminOrdersPage() {
  // لوحة التحكم بتجيب كل الطلبات عبر مسار محمي بكلمة السر (مش عبر StoreContext)
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/orders");
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const updateOrderStatus = useCallback(
    async (id, status) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await refresh();
      return res.ok;
    },
    [refresh]
  );

  const groups = useMemo(() => {
    const map = new Map();
    for (const o of orders) {
      const key = dayKey(o.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(o);
    }
    // orders already مرتّبة الأحدث أولًا من الـ API، فبنحافظ على نفس الترتيب داخل كل يوم
    return Array.from(map.entries()); // [ [key, orders[]], ... ] بترتيب الأحدث أولًا تلقائيًا
  }, [orders]);

  function handleStatusChange(id, status) {
    updateOrderStatus(id, status).then((ok) => {
      showToast(ok ? "تم تحديث حالة الطلب" : "حدث خطأ أثناء التحديث");
    });
  }

  if (loading) {
    return (
      <div className="admin-wrap">
        <div className="admin-tabs">
          <a href="/admin" className="admin-tab">المنتجات</a>
          <span className="admin-tab active">طلبات الشراء</span>
          <a href="/admin/coupons" className="admin-tab">كوبونات الخصم</a>
        </div>
        <div className="note-box">جارِ تحميل الطلبات...</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="admin-wrap">
        <div className="admin-tabs">
          <a href="/admin" className="admin-tab">المنتجات</a>
          <span className="admin-tab active">طلبات الشراء</span>
          <a href="/admin/coupons" className="admin-tab">كوبونات الخصم</a>
        </div>
        <div className="section-head" style={{ margin: "0 0 12px", padding: 0 }}><h2>طلبات الشراء</h2></div>
        <div className="empty-state">لا توجد طلبات حتى الآن.</div>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      <div className="admin-tabs">
        <a href="/admin" className="admin-tab">المنتجات</a>
        <span className="admin-tab active">طلبات الشراء</span>
        <a href="/admin/coupons" className="admin-tab">كوبونات الخصم</a>
      </div>
      <div className="section-head" style={{ margin: "0 0 20px", padding: 0 }}>
        <h2>طلبات الشراء ({orders.length})</h2>
      </div>

      {groups.map(([key, dayOrders]) => {
        const dayTotal = dayOrders.reduce((s, o) => s + Number(o.total || 0), 0);
        return (
          <div key={key} className="order-day-group">
            <div className="order-day-head">
              <h3>{dayLabel(dayOrders[0]?.created_at)}</h3>
              <span>{dayOrders.length} طلب · {dayTotal} ج.م</span>
            </div>

            {dayOrders.map((o) => (
              <div className="admin-order-card" key={o.id}>
                <div className="admin-order-top">
                  <div>
                    <strong>طلب #{o.id}</strong>
                    <span className="admin-order-time">{timeLabel(o.created_at)}</span>
                  </div>
                  <select
                    className={`status-select status-${o.status || "pending"}`}
                    value={o.status || "pending"}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-order-grid">
                  <div>
                    <div className="aorder-label">بيانات العميل</div>
                    <div>{o.name}</div>
                    <div>{o.phone}</div>
                    <div>{o.city} — {o.address}</div>
                  </div>
                  <div>
                    <div className="aorder-label">الدفع</div>
                    <div>{o.pay === "cod" ? "عند الاستلام" : "بطاقة (تجريبي)"}</div>
                    {o.subtotal > 0 && <div>المجموع الفرعي: {o.subtotal} ج.م</div>}
                    {o.discount > 0 && (
                      <div style={{ color: "var(--red)" }}>
                        خصم {o.coupon_code ? `(${o.coupon_code})` : ""}: − {o.discount} ج.م
                      </div>
                    )}
                    {o.shipping > 0 && <div>الشحن: {o.shipping} ج.م</div>}
                    <div className="aorder-total">{o.total} ج.م</div>
                  </div>
                </div>

                <div className="aorder-label" style={{ marginTop: "10px" }}>المنتجات</div>
                <ul className="admin-order-items">
                  {(o.items || []).map((it, i) => (
                    <li key={i}>
                      <span>{it.name}</span>
                      <span>{it.qty} × {it.price} ج.م</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
