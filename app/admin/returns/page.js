"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminTabs from "@/components/AdminTabs";
import { showToast } from "@/components/Toast";

const KIND_LABELS = { return: "استرجاع", exchange: "استبدال" };

const RSTATUS = {
  new: { label: "جديد", color: "#C2870B" },
  approved: { label: "موافق عليه", color: "#2857C6" },
  rejected: { label: "مرفوض", color: "#E31B23" },
};

function when(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("ar-EG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminReturnsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/returns");
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const counts = useMemo(() => {
    const c = { all: rows.length };
    for (const k of Object.keys(RSTATUS)) c[k] = 0;
    for (const r of rows) {
      const st = r.status || "new";
      if (st in c) c[st]++;
    }
    return c;
  }, [rows]);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => (r.status || "new") === filter)),
    [rows, filter]
  );

  async function setStatus(id, status) {
    const res = await fetch(`/api/returns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { showToast("تم تحديث الحالة"); refresh(); }
    else showToast("حصل خطأ");
  }

  async function remove(id) {
    if (!confirm("متأكد إنك عايز تحذف الطلب ده نهائيًا؟")) return;
    const res = await fetch(`/api/returns/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("تم الحذف"); refresh(); }
  }

  const tabs = (
    <AdminTabs active="/admin/returns" />
  );

  if (loading) {
    return (
      <div className="admin-wrap">
        {tabs}
        <div className="note-box">جارِ التحميل...</div>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      {tabs}

      <div className="section-head" style={{ margin: "0 0 16px", padding: 0 }}>
        <h2>الاسترجاع والاستبدال ({rows.length})</h2>
      </div>

      <div className="order-filters">
        <button
          className={`ofilter ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          الكل <span className="cnt">{counts.all}</span>
        </button>
        {Object.entries(RSTATUS).map(([val, info]) => (
          <button
            key={val}
            className={`ofilter ${filter === val ? "active" : ""}`}
            style={{ "--c": info.color }}
            onClick={() => setFilter(val)}
          >
            {info.label} <span className="cnt">{counts[val]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">مفيش طلبات في الحالة دي.</div>
      ) : (
        visible.map((r) => {
          const st = RSTATUS[r.status || "new"] || RSTATUS.new;
          return (
            <div className="rr-card" key={r.id}>
              <div className="rr-card-top">
                <div>
                  <strong>
                    {KIND_LABELS[r.kind] || r.kind} — طلب #{r.order_id}
                  </strong>
                  <span className="rr-card-time">{when(r.created_at)}</span>
                </div>
                <span className="rr-status" style={{ background: st.color }}>{st.label}</span>
              </div>

              <div className="rr-card-grid">
                <div>
                  <div className="aorder-label">العميل</div>
                  <div>{r.customer_name}</div>
                  <div style={{ direction: "ltr", textAlign: "right" }}>{r.customer_phone}</div>
                </div>
                <div>
                  <div className="aorder-label">القطعة</div>
                  <div>{r.item_name}</div>
                  <div>الكمية: {r.item_qty}</div>
                  {r.kind === "exchange" && (
                    <div className="rr-wanted">
                      المطلوب:{" "}
                      {[r.wanted_size && `مقاس ${r.wanted_size}`, r.wanted_color && `لون ${r.wanted_color}`]
                        .filter(Boolean)
                        .join(" · ") || "نفس المواصفات"}
                    </div>
                  )}
                </div>
              </div>

              <div className="aorder-label" style={{ marginTop: 10 }}>السبب</div>
              <div className="rr-reason">{r.reason}</div>
              {r.note && <div className="rr-note">{r.note}</div>}

              <div className="rr-card-actions">
                {(r.status || "new") !== "approved" && (
                  <button className="rr-act ok" onClick={() => setStatus(r.id, "approved")}>موافقة</button>
                )}
                {(r.status || "new") !== "rejected" && (
                  <button className="rr-act no" onClick={() => setStatus(r.id, "rejected")}>رفض</button>
                )}
                <button className="rr-act del" onClick={() => remove(r.id)}>حذف</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
