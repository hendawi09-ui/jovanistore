"use client";
import { useCallback, useEffect, useState } from "react";
import AdminTabs from "@/components/AdminTabs";
import { showToast } from "@/components/Toast";

export default function AdminAlertsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("waiting"); // waiting | done | all
  const [sendingId, setSendingId] = useState(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/stock-alerts", { cache: "no-store" });
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // رسالة الواتساب الجاهزة — بتفتح واتساب برقم الزبون والنص مكتوب
  function waLink(r) {
    let n = String(r.phone || "").replace(/\D/g, "");
    if (n.startsWith("0")) n = "20" + n.slice(1);      // 01xxx → 201xxx
    else if (!n.startsWith("20")) n = "20" + n;
    const details = [r.color, r.size].filter(Boolean).join(" · ");
    const link = `https://www.jovani-store.com/product/${r.product_id}`;
    const msg =
      `أهلًا! 👋\n\n` +
      `المنتج اللي كنت مستنيه رجع متوفر:\n` +
      `*${r.product_name || "المنتج"}*` + (details ? `\n${details}` : "") + `\n\n` +
      `تقدر تطلبه من هنا:\n${link}\n\n` +
      `الكميات محدودة 🌟\nJovani Store`;
    return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
  }

  async function sendEmail(r) {
    if (!r.email) return showToast("الزبون ما سابش إيميل — استخدم الواتساب");
    setSendingId(r.id);
    const res = await fetch("/api/stock-alerts/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id }),
    });
    const data = await res.json().catch(() => ({}));
    setSendingId(null);
    if (res.ok) {
      showToast("الإيميل اتبعت ✓");
      refresh();
    } else {
      showToast(data.error || "فشل الإرسال");
    }
  }

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
                <th>الواتساب</th>
                <th>الإيميل</th>
                <th>التواصل</th>
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
                  <td><span className="alert-phone">{r.phone}</span></td>
                  <td className="alert-email">{r.email || "—"}</td>
                  <td>
                    {r.notified ? (
                      <span className="alert-badge">تم ✓</span>
                    ) : (
                      <div className="alert-actions">
                        <a
                          className="alert-wa"
                          href={waLink(r)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markDone(r.id)}
                          title="ابعت رسالة واتساب"
                        >
                          واتساب
                        </a>
                        <button
                          className="alert-mail"
                          onClick={() => sendEmail(r)}
                          disabled={!r.email || sendingId === r.id}
                          title={r.email ? "ابعت إيميل" : "مفيش إيميل"}
                        >
                          {sendingId === r.id ? "..." : "إيميل"}
                        </button>
                      </div>
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
