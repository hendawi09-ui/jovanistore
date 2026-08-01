"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { showToast } from "@/components/Toast";
import AdminTabs from "@/components/AdminTabs";
import { printShippingLabel } from "@/lib/shippingLabel";

const STATUS_LABELS = {
  pending: "قيد الانتظار",
  confirmed: "تم التأكيد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  returned: "مسترجع",
  cancelled: "ملغي",
};

export const ARCHIVE_AFTER_DAYS = 14;

function daysSinceDelivery(o) {
  const base = o.delivered_at || o.created_at;
  if (!base) return 0;
  return Math.floor((Date.now() - new Date(base).getTime()) / 86400000);
}

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

export default function AdminArchivePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/orders");
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // الأرشيف: طلبات اتسلّمت وعدّى عليها أكتر من مدة الاسترجاع
  const archived = useMemo(
    () =>
      orders.filter(
        (o) => (o.status || "pending") === "delivered" && daysSinceDelivery(o) > ARCHIVE_AFTER_DAYS
      ),
    [orders]
  );

  const total = useMemo(
    () => archived.reduce((sum, o) => sum + Number(o.total || 0), 0),
    [archived]
  );

  const groups = useMemo(() => {
    const map = new Map();
    for (const o of archived) {
      const key = dayKey(o.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(o);
    }
    return Array.from(map.entries());
  }, [archived]);

  async function handleStatusChange(id, status) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await refresh();
      showToast("تم تحديث حالة الطلب");
    } else {
      showToast("حدث خطأ أثناء التحديث");
    }
  }

  if (loading) {
    return (
      <div className="admin-wrap">
        <AdminTabs active="/admin/archive" />
        <div className="note-box">جارِ التحميل...</div>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      <AdminTabs active="/admin/archive" />

      <div className="section-head" style={{ margin: "0 0 16px", padding: 0 }}>
        <h2>الأرشيف ({archived.length})</h2>
      </div>

      <div className="order-summary">
        {archived.length === 0
          ? "مفيش طلبات في الأرشيف"
          : `${archived.length} طلب · إجمالي ${total.toLocaleString("ar-EG")} ج.م`}
        <div className="order-summary-sub">
          الطلبات المسلّمة اللي عدّى عليها أكتر من {ARCHIVE_AFTER_DAYS} يوم — مدة الاسترجاع انتهت.
        </div>
      </div>

      {archived.length === 0 ? (
        <div className="empty-state">مفيش طلبات في الأرشيف لسه.</div>
      ) : (
        groups.map(([key, dayOrders]) => {
          const dayTotal = dayOrders.reduce((s, o) => s + Number(o.total || 0), 0);
          return (
            <div key={key} className="order-day-group">
              <div className="order-day-head">
                <h3>{dayLabel(dayOrders[0]?.created_at)}</h3>
                <span>{dayOrders.length} طلب · {dayTotal} ج.م</span>
              </div>

              {dayOrders.map((o) => (
                <div className="admin-order-card arch" key={o.id}>
                  <div className="admin-order-top">
                    <div>
                      <strong>طلب #{o.id}</strong>
                      <span className="admin-order-time">{timeLabel(o.created_at)}</span>
                      <span className="arch-badge">مؤرشف · من {daysSinceDelivery(o)} يوم</span>
                    </div>
                    <div className="admin-order-tools">
                      <button
                        className="print-label-btn"
                        onClick={() => printShippingLabel(o)}
                        title="طباعة بوليصة الشحن"
                      >
                        🖨 بوليصة
                      </button>
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
        })
      )}
    </div>
  );
}
