"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/StoreContext";
import { IconSvg } from "@/lib/icons";
import { catCssVar, hasDiscount, discountPercent } from "@/lib/products";

// منتجات مقترحة من نفس القسم:
// 2 الأكثر زيارة + 1 الأحدث + 1 عشوائي، بترتيب عشوائي وبدون تكرار
export default function SuggestedProducts({ currentProduct }) {
  const { products } = useStore();

  const picks = useMemo(() => {
    if (!currentProduct) return [];

    const pool = products.filter(
      (p) => p.cat === currentProduct.cat && p.id !== currentProduct.id && p.published !== false
    );
    if (pool.length === 0) return [];

    const used = new Set();
    const out = [];

    function take(list, why) {
      for (const p of list) {
        if (!used.has(p.id)) {
          used.add(p.id);
          out.push({ ...p, why });
          return true;
        }
      }
      return false;
    }

    // 2 الأكثر زيارة
    const byViews = [...pool].sort((a, b) => (b.views || 0) - (a.views || 0));
    take(byViews, "الأكثر زيارة");
    take(byViews, "الأكثر زيارة");

    // 1 الأحدث (الأعلى id = الأحدث إضافة)
    const byNewest = [...pool].sort((a, b) => b.id - a.id);
    take(byNewest, "جديد");

    // 1 عشوائي
    const rest = pool.filter((p) => !used.has(p.id));
    if (rest.length) take([rest[Math.floor(Math.random() * rest.length)]], "مقترح لك");

    // ترتيب عشوائي للعرض
    return out.sort(() => Math.random() - 0.5);
  }, [products, currentProduct]);

  if (picks.length === 0) return null;

  return (
    <div className="suggest">
      <div className="suggest-head">
        <h2>قد يعجبك أيضًا</h2>
        <span>من نفس القسم</span>
      </div>

      <div className="suggest-grid">
        {picks.map((p) => {
          const onSale = hasDiscount(p);
          const price = onSale ? p.salePrice : p.price;
          return (
            <Link href={`/product/${p.id}`} className="scard" key={p.id}>
              <div className="scard-media" style={{ "--c": `var(${catCssVar[p.cat]})` }}>
                {onSale && <span className="scard-disc">-{discountPercent(p)}%</span>}
                {p.images && p.images[0] ? (
                  <img src={p.images[0]} alt={p.name} loading="lazy" />
                ) : (
                  <div className="icon-box"><IconSvg name={p.icon} /></div>
                )}
              </div>
              <div className="scard-body">
                <h4>{p.name}</h4>
                <div className="scard-price">
                  {price} ج.م
                  {onSale && <span className="scard-old">{p.price}</span>}
                </div>
                <span className="scard-why">{p.why}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
