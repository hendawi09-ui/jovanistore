"use client";
import { useCallback, useEffect, useState } from "react";
import { showToast } from "@/components/Toast";

const emptyForm = {
  code: "",
  type: "percent",
  value: "",
  expires_at: "",
  max_uses: "",
  min_total: "",
  min_items: "",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/coupons");
    if (res.ok) setCoupons(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "code" ? value.toUpperCase() : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      showToast("تمت إضافة الكوبون");
      setForm(emptyForm);
      refresh();
    } else {
      showToast(data.error || "حدث خطأ");
    }
  }

  async function toggleActive(c) {
    const res = await fetch(`/api/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    if (res.ok) { showToast(c.active ? "تم إيقاف الكوبون" : "تم تفعيل الكوبون"); refresh(); }
    else showToast("حدث خطأ");
  }

  async function remove(c) {
    const res = await fetch(`/api/coupons/${c.id}`, { method: "DELETE" });
    if (res.ok) { showToast("تم حذف الكوبون"); refresh(); }
    else showToast("حدث خطأ");
  }

  function limitsText(c) {
    const parts = [];
    if (c.expires_at) parts.push(`ينتهي ${c.expires_at}`);
    if (c.max_uses) parts.push(`${c.uses || 0}/${c.max_uses} استخدام`);
    else parts.push(`${c.uses || 0} استخدام`);
    if (c.min_total) parts.push(`حد أدنى ${c.min_total} ج.م`);
    if (c.min_items) parts.push(`${c.min_items} قطع فأكثر`);
    return parts.join(" · ");
  }

  function isExpired(c) {
    return c.expires_at && c.expires_at < new Date().toISOString().slice(0, 10);
  }
  function isExhausted(c) {
    return c.max_uses && (c.uses || 0) >= c.max_uses;
  }

  return (
    <div className="admin-wrap">
      <div className="admin-tabs">
        <a href="/admin" className="admin-tab">المنتجات</a>
        <a href="/admin/orders" className="admin-tab">طلبات الشراء</a>
        <span className="admin-tab active">كوبونات الخصم</span>
      </div>

      <div className="section-head" style={{ margin: "0 0 12px", padding: 0 }}>
        <h2>إضافة كوبون جديد</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="admin-grid">
          <div className="field">
            <label>كود الخصم</label>
            <input required name="code" value={form.code} onChange={handleChange} placeholder="SUMMER25" />
          </div>
          <div className="field">
            <label>نوع الخصم</label>
            <select className="admin-select" name="type" value={form.type} onChange={handleChange}>
              <option value="percent">نسبة مئوية (%)</option>
              <option value="fixed">مبلغ ثابت (ج.م)</option>
            </select>
          </div>
          <div className="field">
            <label>{form.type === "fixed" ? "قيمة الخصم (ج.م)" : "نسبة الخصم (%)"}</label>
            <input required type="number" min="1" name="value" value={form.value} onChange={handleChange} />
          </div>
          <div className="field">
            <label>تاريخ الانتهاء (اختياري)</label>
            <input type="date" name="expires_at" value={form.expires_at} onChange={handleChange} />
          </div>
          <div className="field">
            <label>أقصى عدد استخدامات (اختياري)</label>
            <input type="number" min="1" name="max_uses" value={form.max_uses} onChange={handleChange} placeholder="بدون حد" />
          </div>
          <div className="field">
            <label>حد أدنى لقيمة الطلب (اختياري)</label>
            <input type="number" min="1" name="min_total" value={form.min_total} onChange={handleChange} placeholder="بدون حد" />
          </div>
          <div className="field">
            <label>حد أدنى لعدد القطع (اختياري)</label>
            <input type="number" min="1" name="min_items" value={form.min_items} onChange={handleChange} placeholder="مثال: 3" />
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "جارِ الحفظ..." : "إضافة الكوبون"}
        </button>
      </form>

      <div className="section-head" style={{ margin: "40px 0 16px", padding: 0, alignItems: "center" }}>
        <h2 style={{ fontSize: "20px" }}>الكوبونات ({coupons.length})</h2>
      </div>

      {loading ? (
        <div className="note-box">جارِ التحميل...</div>
      ) : coupons.length === 0 ? (
        <div className="note-box">لا توجد كوبونات بعد.</div>
      ) : (
        <div className="coupon-list">
          {coupons.map((c) => {
            const dead = !c.active || isExpired(c) || isExhausted(c);
            return (
              <div className={`coupon-card ${dead ? "inactive" : ""}`} key={c.id}>
                <div className="coupon-card-main">
                  <div className="coupon-code">{c.code}</div>
                  <div className="coupon-value">
                    {c.type === "fixed" ? `${c.value} ج.م` : `${c.value}%`} خصم
                  </div>
                  <div className="coupon-limits">{limitsText(c)}</div>
                </div>
                <div className="coupon-card-side">
                  <span className={`pub-badge ${dead ? "pub-no" : "pub-yes"}`}>
                    {!c.active ? "موقوف" : isExpired(c) ? "منتهي" : isExhausted(c) ? "مستهلك" : "فعّال"}
                  </span>
                  <div className="coupon-card-actions">
                    <button className="pub-btn" onClick={() => toggleActive(c)}>
                      {c.active ? "إيقاف" : "تفعيل"}
                    </button>
                    <button className="del-btn" onClick={() => remove(c)}>حذف</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
