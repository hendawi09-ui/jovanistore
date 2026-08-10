"use client";

// شريط فلاتر المتجر: المقاس، نطاق السعر، والترتيب.
// كل الفلاتر اختيارية — الافتراضي إن مفيش أي فلتر شغّال.
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
  const hasFilters = activeSizes.length > 0 || price < priceMax;

  return (
    <div className="shop-filters">
      {/* المقاسات */}
      {sizes.length > 0 && (
        <div className="sf-group">
          <span className="sf-label">المقاس</span>
          <div className="sf-sizes">
            {sizes.map((s) => (
              <button
                key={s}
                className={`sf-size ${activeSizes.includes(s) ? "active" : ""}`}
                onClick={() => toggleSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* السعر */}
      {priceMax > 0 && (
        <div className="sf-group sf-price-group">
          <span className="sf-label">
            السعر حتى <strong>{price} ج.م</strong>
          </span>
          <input
            type="range"
            className="sf-range"
            min={0}
            max={priceMax}
            step={10}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            aria-label="أقصى سعر"
          />
        </div>
      )}

      {/* الترتيب */}
      <div className="sf-group">
        <span className="sf-label">الترتيب</span>
        <select className="sf-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="default">المعروض افتراضيًا</option>
          <option value="newest">الأحدث</option>
          <option value="price-asc">السعر: من الأقل</option>
          <option value="price-desc">السعر: من الأعلى</option>
        </select>
      </div>

      {hasFilters && (
        <button className="sf-reset" onClick={onReset}>
          إلغاء الفلاتر ({resultCount})
        </button>
      )}
    </div>
  );
}
