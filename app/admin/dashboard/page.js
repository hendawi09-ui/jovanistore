"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/StoreContext";
import { getTotalStock, stockKey, parseSize, effectivePrice } from "@/lib/products";
import { IconSvg } from "@/lib/icons";

const NON_REVENUE = ["cancelled", "returned"]; // حالات لا تُحتسب ضمن المبيعات

const LOW_STOCK = 3; // تحت الرقم ده يعتبر مخزون منخفض

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function egp(n) {
  return Math.round(n || 0).toLocaleString("ar-EG");
}

export default function AdminDashboardPage() {
  const { products } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/orders");
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);

    let todaySales = 0, todayCount = 0;
    let weekSales = 0, weekCount = 0;
    let allSales = 0;
    let pending = 0;
    const daily = new Map(); // مبيعات آخر 7 أيام

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      daily.set(d.toISOString().slice(0, 10), 0);
    }

    for (const o of orders) {
      const total = Number(o.total) || 0;
      const created = o.created_at ? new Date(o.created_at) : null;
      const status = o.status || "pending";

      if (!NON_REVENUE.includes(status)) allSales += total;
      if (status === "pending") pending++;

      if (created) {
        const key = created.toISOString().slice(0, 10);
        if (daily.has(key) && !NON_REVENUE.includes(status)) {
          daily.set(key, daily.get(key) + total);
        }
        if (created >= today && !NON_REVENUE.includes(status)) {
          todaySales += total;
          todayCount++;
        }
        if (created >= weekAgo && !NON_REVENUE.includes(status)) {
          weekSales += total;
          weekCount++;
        }
      }
    }

    return {
      todaySales, todayCount,
      weekSales, weekCount,
      allSales, pending,
      daily: Array.from(daily.entries()),
      avgOrder: weekCount > 0 ? weekSales / weekCount : 0,
    };
  }, [orders]);

  // تنبيهات المخزون: كل تركيبة (منتج + مقاس) كميتها قليلة أو خلصت
  const stockAlerts = useMemo(() => {
    const low = [];
    const out = [];

    for (const p of products) {
      const stock = p.stock;
      if (!stock || typeof stock !== "object") continue;

      const sizes = (p.sizes || []).map((s) => parseSize(s).name);
      const color = p.colorName || "";
      const list = sizes.length > 0 ? sizes : [""];

      for (const size of list) {
        const qty = stock[stockKey(color, size)];
        if (typeof qty !== "number") continue;
        const item = { id: p.id, name: p.name, color, size, qty, published: p.published !== false };
        if (qty === 0) out.push(item);
        else if (qty <= LOW_STOCK) low.push(item);
      }
    }

    low.sort((a, b) => a.qty - b.qty);
    return { low, out };
  }, [products]);

  // أكتر 5 منتجات زيارة لكل قسم (رجالي / نسائي)
  const topViewedMen = useMemo(() => {
    return [...products]
      .filter((p) => p.cat === "men" && (p.views || 0) > 0)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10);
  }, [products]);

  const topViewedWomen = useMemo(() => {
    return [...products]
      .filter((p) => p.cat === "women" && (p.views || 0) > 0)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10);
  }, [products]);

  const publishedCount = products.filter((p) => p.published !== false).length;
  const soldOutProducts = products.filter((p) => getTotalStock(p) === 0).length;
  const maxDaily = Math.max(...stats.daily.map(([, v]) => v), 1);

  const tabs = (
    <div className="admin-tabs">
      <span className="admin-tab active">لوحة المعلومات</span>
      <a href="/admin" className="admin-tab">المنتجات</a>
      <a href="/admin/orders" className="admin-tab">طلبات الشراء</a>
      <a href="/admin/coupons" className="admin-tab">كوبونات الخصم</a>
      <a href="/admin/hero" className="admin-tab">هيرو الرئيسية</a>
    </div>
  );

  if (loading) {
    return (
      <div className="admin-wrap">
        {tabs}
        <div className="note-box">جارِ تحميل الإحصائيات...</div>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      {tabs}

      {/* بطاقات الأرقام */}
      <div className="stat-grid">
        <div className="stat-card sc-red">
          <div className="stat-ico">💰</div>
          <div className="stat-label">مبيعات اليوم</div>
          <div className="stat-value">{egp(stats.todaySales)} <small>ج.م</small></div>
          <div className="stat-sub">{stats.todayCount} طلب</div>
        </div>

        <div className="stat-card sc-blue">
          <div className="stat-ico">📈</div>
          <div className="stat-label">آخر 7 أيام</div>
          <div className="stat-value">{egp(stats.weekSales)} <small>ج.م</small></div>
          <div className="stat-sub">{stats.weekCount} طلب · متوسط {egp(stats.avgOrder)} ج.م</div>
        </div>

        <div className="stat-card sc-amber">
          <div className="stat-ico">⏳</div>
          <div className="stat-label">طلبات تنتظر التأكيد</div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-sub">
            {stats.pending > 0
              ? <a href="/admin/orders" className="stat-link">راجعها الآن ←</a>
              : "مفيش طلبات معلّقة 👏"}
          </div>
        </div>

        <div className="stat-card sc-green">
          <div className="stat-ico">👕</div>
          <div className="stat-label">المنتجات المنشورة</div>
          <div className="stat-value">{publishedCount}</div>
          <div className="stat-sub">
            {soldOutProducts > 0 ? `${soldOutProducts} نفدت كميته` : "كلها متوفرة ✓"}
          </div>
        </div>
      </div>

      {/* رسم بياني لآخر 7 أيام */}
      <div className="panel">
        <div className="panel-head">
          <h3>مبيعات آخر 7 أيام</h3>
          <span>الإجمالي الكلي: {egp(stats.allSales)} ج.م</span>
        </div>
        <div className="chart">
          {stats.daily.map(([day, val], i) => {
            const h = Math.max(4, (val / maxDaily) * 100);
            const d = new Date(day);
            const label = d.toLocaleDateString("ar-EG", { weekday: "short" });
            return (
              <div className="chart-col" key={day} style={{ animationDelay: `${i * 70}ms` }}>
                <div className="chart-val">{val > 0 ? egp(val) : ""}</div>
                <div className="chart-bar" style={{ height: `${h}%` }} />
                <div className="chart-day">{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* أكتر 5 منتجات زيارة - مقسّمة رجالي ونسائي */}
      <div className="panel">
        <div className="panel-head">
          <h3>الأكثر زيارة</h3>
          <span>أعلى 10 منتجات في كل قسم حسب عدد الزيارات</span>
        </div>

        <div className="top-viewed-split">
          <div className="top-viewed-col">
            <h4 className="top-viewed-col-title">رجالي</h4>
            {topViewedMen.length === 0 ? (
              <div className="alert-empty">لسه مفيش زيارات مسجّلة</div>
            ) : (
              <div className="top-viewed-list">
                {topViewedMen.map((p, i) => (
                  <div className="top-viewed-row" key={p.id}>
                    <span className="top-viewed-rank">{i + 1}</span>
                    {p.images && p.images[0] ? (
                      <img className="top-viewed-thumb" src={p.images[0]} alt="" />
                    ) : (
                      <div className="top-viewed-thumb icon-box"><IconSvg name={p.icon} /></div>
                    )}
                    <span className="top-viewed-name">{p.name}</span>
                    <span className="top-viewed-count">👁 {p.views || 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="top-viewed-col">
            <h4 className="top-viewed-col-title">نسائي</h4>
            {topViewedWomen.length === 0 ? (
              <div className="alert-empty">لسه مفيش زيارات مسجّلة</div>
            ) : (
              <div className="top-viewed-list">
                {topViewedWomen.map((p, i) => (
                  <div className="top-viewed-row" key={p.id}>
                    <span className="top-viewed-rank">{i + 1}</span>
                    {p.images && p.images[0] ? (
                      <img className="top-viewed-thumb" src={p.images[0]} alt="" />
                    ) : (
                      <div className="top-viewed-thumb icon-box"><IconSvg name={p.icon} /></div>
                    )}
                    <span className="top-viewed-name">{p.name}</span>
                    <span className="top-viewed-count">👁 {p.views || 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* تنبيهات المخزون */}
      <div className="panel">
        <div className="panel-head">
          <h3>تنبيهات المخزون</h3>
          <span>تحت {LOW_STOCK} قطع يعتبر منخفض</span>
        </div>

        {stockAlerts.out.length === 0 && stockAlerts.low.length === 0 ? (
          <div className="alert-empty">🎉 كل المقاسات فيها كميات كافية</div>
        ) : (
          <div className="alert-list">
            {stockAlerts.out.map((a, i) => (
              <div className="alert-row out" key={`o${i}`}>
                <span className="alert-badge">نفد</span>
                <span className="alert-name">
                  {a.name}
                  {a.color ? ` — ${a.color}` : ""}
                  {a.size ? ` · مقاس ${a.size}` : ""}
                </span>
                <span className="alert-qty">0</span>
              </div>
            ))}
            {stockAlerts.low.map((a, i) => (
              <div className="alert-row low" key={`l${i}`}>
                <span className="alert-badge">منخفض</span>
                <span className="alert-name">
                  {a.name}
                  {a.color ? ` — ${a.color}` : ""}
                  {a.size ? ` · مقاس ${a.size}` : ""}
                </span>
                <span className="alert-qty">{a.qty}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
