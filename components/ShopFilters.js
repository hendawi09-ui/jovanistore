"use client";
import { useState } from "react";

// فلاتر المتجر: زرار أيقونة واحد بيفتح لوحة فيها المقاس والسعر والترتيب.
export default function ShopFilters({
  sizes,          // كل المقاسات المتاحة في المنتجات المعروضة
  activeSizes,    // المقاسات المختارة (مصفوفة)
  toggleSize,
  priceMax,       // أعلى سعر في المنتجات
  price,          // السقف المختار حاليًا
  setPrice,
  sort,
  setSort,
  onReset,
  resultCount,
}) {
  const [open, setOpen] = useState(false);

  // عدد الفلاتر الشغّالة — بيظهر كرقم على الأيقونة
  const activeCount =
    activeSizes.length +
    (priceMax > 0 && price < priceMax ? 1 : 0) +
    (sort !== "default" ? 1 : 0);

  return (
    <>
      <div className="filters-bar">
        <button
          className={`filters-toggle ${activeCount > 0 ? "has-active" : ""}`}
          onClick={() => setOpen((o) => !o)}
          aria-label="الفلاتر"
          aria-expanded={open}
          title="الفلاتر"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M7 12h10M11 18h2" />
          </svg>
          {activeCount > 0 && <span className="ft-badge">{activeCount}</span>}
        </button>
        <span className="filters-count">{resultCount} منتج</span>
      </div>

      <div className={`filters-panel ${open ? "open" : ""}`}>
        <div className="filters-inner">
          {sizes.length > 0 && (
            <div className="sf-row">
              <span className="sf-label">المقاس</span>
              <div className="sf-sizes">
                {sizes.map((s) => (
                  <button
                    key={s}
                    className={`sf-size ${activeSizes.includes(s) ? "active" : ""}`}
                    onClick={() => toggleSize(s)}
                    tabIndex={open ? 0 : -1}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {priceMax > 0 && (
            <div className="sf-row">
              <span className="sf-label">السعر</span>
              <input
                type="range"
                className="sf-range"
                min={0}
                max={priceMax}
                step={10}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                aria-label="أقصى سعر"
                tabIndex={open ? 0 : -1}
              />
              <span className="sf-label sf-label-inline">
                حتى <strong>{price}</strong> ج.م
              </span>
            </div>
          )}

          <div className="sf-row">
            <span className="sf-label">الترتيب</span>
            <select
              className="sf-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              tabIndex={open ? 0 : -1}
            >
              <option value="default">المعروض افتراضيًا</option>
              <option value="newest">الأحدث</option>
              <option value="price-asc">السعر: من الأقل</option>
              <option value="price-desc">السعر: من الأعلى</option>
            </select>
          </div>

          <div className="sf-foot">
            <button className="sf-reset" onClick={onReset} tabIndex={open ? 0 : -1}>
              إلغاء الكل
            </button>
            <button className="sf-apply" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
              عرض النتائج
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
