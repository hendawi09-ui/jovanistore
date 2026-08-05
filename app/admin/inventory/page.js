"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminTabs from "@/components/AdminTabs";
import { showToast } from "@/components/Toast";
import { stockKey, catLabel } from "@/lib/products";

const LOW_KEY = "jv_low_stock_threshold";

// بيفكّك مخزون المنتج لصفوف: كل صف = تركيبة (لون + مقاس) وكميتها
function variantRows(p) {
  const stock = p.stock && typeof p.stock === "object" ? p.stock : null;
  if (!stock) return []; // المخزون مش مفعّل للمنتج ده

  const colors = p.colorName ? [p.colorName] : [""];
  const sizes = p.sizes?.length > 0 ? p.sizes.map((s) => (typeof s === "string" ? s.split("|")[0] : s)) : [""];

  const rows = [];
  for (const c of colors) {
    for (const s of sizes) {
      const key = stockKey(c, s);
      rows.push({ key, color: c, size: s, qty: typeof stock[key] === "number" ? stock[key] : 0 });
    }
  }
  // أي مفاتيح قديمة موجودة في المخزون ومش في القوايم الحالية
  for (const key of Object.keys(stock)) {
    if (!rows.some((r) => r.key === key)) {
      const [c, s] = key.split("|");
      rows.push({ key, color: c, size: s, qty: stock[key] || 0, orphan: true });
    }
  }
  return rows;
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | out | low | ok
  const [query, setQuery] = useState("");
  const [lowThreshold, setLowThreshold] = useState(3);
  const [savingKey, setSavingKey] = useState(null);
  const [moves, setMoves] = useState([]);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    const saved = Number(localStorage.getItem(LOW_KEY));
    if (saved > 0) setLowThreshold(saved);
  }, []);

  function updateThreshold(v) {
    const n = Math.max(1, Number(v) || 1);
    setLowThreshold(n);
    localStorage.setItem(LOW_KEY, String(n));
  }

  const refresh = useCallback(async () => {
    const res = await fetch("/api/products");
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }, []);

  const refreshLog = useCallback(async () => {
    const res = await fetch("/api/inventory?limit=80");
    if (res.ok) setMoves(await res.json());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (showLog) refreshLog(); }, [showLog, refreshLog]);

  // بنبني قايمة صفوف مسطّحة: منتج + تركيبة، عشان الفلترة والعرض يبقوا بسيطين
  const rows = useMemo(() => {
    const out = [];
    for (const p of products) {
      for (const v of variantRows(p)) {
        out.push({ product: p, ...v });
      }
    }
    return out;
  }, [products]);

  // بنجمّع الصفوف حسب كود القطعة: كل كود بيبقى سطر واحد فيه كل ألوانه ومقاساته.
  // المنتجات اللي مالهاش كود بتتعامل كل واحدة لوحدها (بنستخدم معرّفها كمفتاح مؤقت).
  const groups = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const code = r.product.groupKey || `__solo_${r.product.id}`;
      if (!map.has(code)) {
        map.set(code, {
          code: r.product.groupKey || null,
          label: r.product.name,
          cat: r.product.cat,
          items: [],
        });
      }
      map.get(code).items.push(r);
    }
    return [...map.values()];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .map((g) => {
        // الفلتر بيشتغل على مستوى التركيبة، والمجموعة بتظهر لو فيها تركيبة واحدة مطابقة
        const items = g.items.filter((r) => {
          if (filter === "out") return r.qty === 0;
          if (filter === "low") return r.qty > 0 && r.qty <= lowThreshold;
          if (filter === "ok") return r.qty > lowThreshold;
          return true;
        });
        return { ...g, items };
      })
      .filter((g) => {
        if (g.items.length === 0) return false;
        if (!q) return true;
        // البحث بيشمل الكود واسم أي منتج جوه المجموعة
        const code = (g.code || "").toLowerCase();
        if (code.includes(q)) return true;
        return g.items.some((r) => (r.product.name || "").toLowerCase().includes(q));
      });
  }, [groups, filter, query, lowThreshold]);

  const counts = useMemo(() => ({
    out: rows.filter((r) => r.qty === 0).length,
    low: rows.filter((r) => r.qty > 0 && r.qty <= lowThreshold).length,
    ok: rows.filter((r) => r.qty > lowThreshold).length,
  }), [rows, lowThreshold]);

  async function setQty(row, newQty) {
    const qty = Math.max(0, newQty);
    if (qty === row.qty) return;

    const id = `${row.product.id}:${row.key}`;
    setSavingKey(id);

    // بنحدّث الشاشة فورًا عشان الإحساس يبقى سريع، ولو فشل بنرجّع القيمة
    setProducts((prev) => prev.map((p) =>
      p.id === row.product.id
        ? { ...p, stock: { ...(p.stock || {}), [row.key]: qty } }
        : p
    ));

    const res = await fetch("/api/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: row.product.id, variantKey: row.key, newQty: qty }),
    });

    setSavingKey(null);

    if (!res.ok) {
      showToast("فشل الحفظ — رجعنا القيمة القديمة");
      setProducts((prev) => prev.map((p) =>
        p.id === row.product.id
          ? { ...p, stock: { ...(p.stock || {}), [row.key]: row.qty } }
          : p
      ));
      return;
    }
    if (showLog) refreshLog();
  }

  const moveLabel = {
    sale: "بيع",
    restock: "توريد",
    adjustment: "تسوية",
    return: "مرتجع",
  };

  return (
    <div className="orders-wrap">
      <AdminTabs active="/admin/inventory" />

      <div className="section-head" style={{ margin: "0 0 18px", padding: 0 }}>
        <h2>إدارة المخزون</h2>
        <button className="btn-ghost" onClick={() => setShowLog((s) => !s)}>
          {showLog ? "إخفاء سجل الحركة" : "عرض سجل الحركة"}
        </button>
      </div>

      {/* ملخّص سريع */}
      <div className="inv-summary">
        <button className={`inv-stat ${filter === "out" ? "active" : ""}`} onClick={() => setFilter(filter === "out" ? "all" : "out")}>
          <span className="inv-stat-num inv-out">{counts.out}</span>
          <span className="inv-stat-label">نفد المخزون</span>
        </button>
        <button className={`inv-stat ${filter === "low" ? "active" : ""}`} onClick={() => setFilter(filter === "low" ? "all" : "low")}>
          <span className="inv-stat-num inv-low">{counts.low}</span>
          <span className="inv-stat-label">أوشك على النفاد</span>
        </button>
        <button className={`inv-stat ${filter === "ok" ? "active" : ""}`} onClick={() => setFilter(filter === "ok" ? "all" : "ok")}>
          <span className="inv-stat-num inv-ok">{counts.ok}</span>
          <span className="inv-stat-label">متوفر</span>
        </button>
      </div>

      <div className="inv-controls">
        <input
          className="field-input"
          placeholder="ابحث باسم المنتج أو كود القطعة..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="inv-threshold">
          حد التنبيه
          <input
            type="number"
            min="1"
            className="field-input"
            value={lowThreshold}
            onChange={(e) => updateThreshold(e.target.value)}
          />
        </label>
        {filter !== "all" && (
          <button className="btn-ghost" onClick={() => setFilter("all")}>إلغاء الفلتر</button>
        )}
      </div>

      {loading ? (
        <div className="empty-state">جارِ التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          {rows.length === 0
            ? "مفيش منتجات مفعّل عليها تتبّع المخزون. فعّله من صفحة المنتجات."
            : "مفيش نتائج مطابقة."}
        </div>
      ) : (
        <div className="inv-groups">
          {filtered.map((g) => {
            const total = g.items.reduce((s, r) => s + r.qty, 0);
            const worst = g.items.some((r) => r.qty === 0)
              ? "out"
              : g.items.some((r) => r.qty <= lowThreshold)
              ? "low"
              : "ok";

            // بنجمّع تركيبات كل لون تحت بعض، عشان اللون يبقى سطر واحد بمقاساته
            const byColor = new Map();
            for (const r of g.items) {
              const c = r.color || "";
              if (!byColor.has(c)) byColor.set(c, []);
              byColor.get(c).push(r);
            }

            return (
              <div key={g.code || g.label} className={`inv-group inv-group-${worst}`}>
                <div className="inv-group-head">
                  {g.code ? (
                    <span className="inv-code">{g.code}</span>
                  ) : (
                    <span className="inv-code-none">بدون كود</span>
                  )}
                  <span className="inv-group-name">{g.label}</span>
                  <span className="inv-group-cat">{catLabel[g.cat] || "—"}</span>
                  <span className="inv-group-total">الإجمالي: {total}</span>
                </div>

                {[...byColor.entries()].map(([color, items]) => (
                  <div className="inv-color-row" key={color || "__none"}>
                    <a
                      className="inv-color-link"
                      href={`/product/${items[0].product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="افتح صفحة المنتج بهذا اللون"
                    >
                      {color || "بدون لون"}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 4h6v6" /><path d="M20 4L10 14" />
                        <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
                      </svg>
                    </a>

                    <div className="inv-sizes">
                      {items.map((r) => {
                        const id = `${r.product.id}:${r.key}`;
                        const state = r.qty === 0 ? "out" : r.qty <= lowThreshold ? "low" : "ok";
                        return (
                          <div key={id} className={`inv-size-chip inv-chip-${state}`}>
                            <span className="inv-size-label">{r.size || "مقاس واحد"}</span>
                            <div className="inv-qty">
                              <button
                                className="inv-step"
                                onClick={() => setQty(r, r.qty - 1)}
                                disabled={r.qty === 0 || savingKey === id}
                                aria-label="نقص واحد"
                              >−</button>
                              <input
                                type="number"
                                min="0"
                                className="inv-qty-input"
                                value={r.qty}
                                onChange={(e) => setQty(r, Number(e.target.value))}
                                disabled={savingKey === id}
                              />
                              <button
                                className="inv-step"
                                onClick={() => setQty(r, r.qty + 1)}
                                disabled={savingKey === id}
                                aria-label="زود واحد"
                              >+</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {showLog && (
        <>
          <div className="section-head" style={{ margin: "34px 0 14px", padding: 0 }}>
            <h2 style={{ fontSize: 18 }}>سجل حركة المخزون</h2>
          </div>
          {moves.length === 0 ? (
            <div className="empty-state">مفيش حركات مسجّلة لحد دلوقتي.</div>
          ) : (
            <div className="inv-table-wrap">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>المنتج</th>
                    <th>التركيبة</th>
                    <th>النوع</th>
                    <th>التغيير</th>
                    <th>من ← إلى</th>
                  </tr>
                </thead>
                <tbody>
                  {moves.map((m) => {
                    const [c, s] = (m.variant_key || "|").split("|");
                    return (
                      <tr key={m.id}>
                        <td className="inv-date">
                          {new Date(m.created_at).toLocaleString("ar-EG", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="inv-name">{m.product_name || `#${m.product_id}`}</td>
                        <td>{[c, s].filter(Boolean).join(" · ") || "—"}</td>
                        <td>
                          <span className={`inv-move inv-move-${m.move_type}`}>
                            {moveLabel[m.move_type] || m.move_type}
                          </span>
                        </td>
                        <td className={m.change > 0 ? "inv-ok" : "inv-out"}>
                          {m.change > 0 ? `+${m.change}` : m.change}
                        </td>
                        <td>{m.before_qty} ← {m.after_qty}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
