"use client";
import { useEffect, useState } from "react";

const KEY = "jv_admin_cat_filter";

// فلتر القسم المشترك بين كل صفحات لوحة التحكم.
// الاختيار بيتحفظ في المتصفح، فلو رحت من صفحة للتانية بيفضل زي ما هو.
export function useAdminCatFilter() {
  const [cat, setCatState] = useState("all");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === "men" || saved === "women") setCatState(saved);
    setReady(true);
  }, []);

  function setCat(v) {
    setCatState(v);
    try { localStorage.setItem(KEY, v); } catch { /* تجاهل */ }
  }

  return { cat, setCat, ready };
}

// خريطة معرّف المنتج ← قسمه، بنبنيها مرة واحدة ونستخدمها في فلترة الطلبات
export function buildCatMap(products) {
  const m = new Map();
  for (const p of products || []) m.set(String(p.id), p.cat);
  return m;
}

// الطلب بيظهر لو فيه قطعة واحدة على الأقل من القسم المختار
export function orderMatchesCat(order, cat, catMap) {
  if (cat === "all") return true;
  const items = order?.items || [];
  if (items.length === 0) return false;
  return items.some((it) => catMap.get(String(it.productId)) === cat);
}

export default function AdminCatFilter({ cat, setCat, counts }) {
  const options = [
    { id: "all", label: "الكل" },
    { id: "men", label: "رجالي" },
    { id: "women", label: "نسائي" },
  ];

  return (
    <div className="admin-cat-filter">
      {options.map((o) => (
        <button
          key={o.id}
          className={`acf-btn ${cat === o.id ? "active" : ""}`}
          onClick={() => setCat(o.id)}
        >
          {o.label}
          {counts && typeof counts[o.id] === "number" && (
            <span className="acf-count">{counts[o.id]}</span>
          )}
        </button>
      ))}
    </div>
  );
}
