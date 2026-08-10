"use client";
import { useCallback, useEffect, useState } from "react";
import AdminTabs from "@/components/AdminTabs";
import { showToast } from "@/components/Toast";

export default function AdminAlertsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("waiting"); // waiting | done | all

  const refresh = useCallback(async () => {
    const res = await fetch("/api/stock-alerts", { cache: "no-store" });
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function markDone(id) {
    const res = await fetch("/api/stock-alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showToast("اتعلّم إنك كلمته ✓");
      refresh();
    } else {
      showToast("حصل خطأ");
    }
  }

  const visible = rows.filter((r) => {
    if (filter === "waiting") return !r.notified;
    if (filter === "done") return r.notified;
    return true;
  });

  const waitingCount = rows.filter((r) => !r.notified).length;

  return (
    <div className="orders-wrap">
      <AdminTabs active="/admin/alerts" />

      <div className="section-head" style={{ margin: "0 0 6px", padding: 0 }}>
        <h2>طلبات التنبيه عند التوفر</h2>
      </div>
      <div className="guide-box" style={{ marginBottom: 16 }}>
        دول زباين حاولوا يشتروا مقاس نافد وسابوا رقمهم. أول ما تضيف الكمية في المخزون،
        كلّمهم واعلّم الطلب إنه خلص.
      </div>

      <div className="admin-filter" style={{ marginBottom: 16 }}>
        {[
          { k: "waiting", label: `في انتظار التواصل (${waitingCount})` },
          { k: "done", label: "تم التواصل" },
          { k: "all", label: "الكل" },
        ].map((f) => (
          <button
            key={f.k}
            className={`filter-tab ${filter === f.k ? "active" : ""}`}
            onClick={() => setFilter(f.k)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">جارِ التحميل...</div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          {filter === "waiting" ? "مفيش طلبات في انتظار التواصل." : "مفيش طلبات هنا."}
        </div>
      ) : (
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>المنتج</th>
                <th>المقاس</th>
                <th>اللون</th>
                <th>رقم الموبايل</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className={r.notified ? "alert-done" : ""}>
                  <td className="inv-date">
                    {new Date(r.created_at).toLocaleString("ar-EG", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="inv-name">{r.product_name || `#${r.product_id}`}</td>
                  <td>{r.size || "—"}</td>
                  <td>{r.color || "—"}</td>
                  <td>
                    <a className="alert-phone" href={`tel:${r.phone}`}>{r.phone}</a>
                  </td>
                  <td>
                    {r.notified ? (
                      <span className="alert-badge">تم ✓</span>
                    ) : (
                      <button className="pub-btn" onClick={() => markDone(r.id)}>
                        كلّمته
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
