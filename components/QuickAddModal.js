"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/StoreContext";
import {
  parseSize,
  getStock,
  getTotalStock,
  hasDiscount,
} from "@/lib/products";
import { showToast } from "./Toast";

export default function QuickAddModal({ product: p, open, onClose }) {
  const { addToCart } = useStore();
  const [size, setSize] = useState("");

  const productColor = p?.colorName || "";
  const rawSizes = (p?.sizes || []).map(parseSize);
  const trackingStock = getTotalStock(p) !== null;

  // المقاس متاح لو مش مشطوب يدويًا ولو فيه كمية في المخزون للّون المختار
  const parsedSizes = rawSizes.map((s) => {
    if (!s.available || !trackingStock) return s;
    return { ...s, available: getStock(p, productColor, s.name) > 0 };
  });

  // لما اللون يتغيّر، نختار أول مقاس متاح لهذا اللون
  useEffect(() => {
    if (!open) return;
    const first = parsedSizes.find((s) => s.available);
    setSize(first ? first.name : "");
  }, [open, p?.id]);

  // قفل تمرير الصفحة ورا النافذة
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !p) return null;

  const currentStock = trackingStock ? getStock(p, productColor, size) : null;

  function handleAdd() {
    if (parsedSizes.some((s) => s.available) && !size) return showToast("من فضلك اختر المقاس");
    if (trackingStock && (!currentStock || currentStock <= 0)) {
      return showToast("هذا الخيار غير متوفر حاليًا");
    }
    addToCart(p.id, 1, { color: productColor, size });
    showToast("أُضيف المنتج إلى سلتك ✓");
    onClose();
  }

  return (
    <div className="qa-overlay" onClick={onClose}>
      <div className="qa-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="qa-head">
          <div className="qa-title">
            <h4>{p.name}</h4>
            <div className="qa-price">
              {hasDiscount(p) ? (
                <>
                  <span className="price-sale">{p.salePrice} ج.م</span>{" "}
                  <s className="price-old">{p.price}</s>
                </>
              ) : (
                `${p.price} ج.م`
              )}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>

        {parsedSizes.length > 0 && (
          <div className="qa-block">
            <label>المقاس{size ? ` — ${size}` : ""}</label>
            <div className="size-row">
              {parsedSizes.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  disabled={!s.available}
                  className={`size-box ${size === s.name ? "active" : ""} ${!s.available ? "unavailable" : ""}`}
                  onClick={() => s.available && setSize(s.name)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {trackingStock && currentStock !== null && currentStock > 0 && currentStock <= 3 && (
          <div className="stock-note low">باقي {currentStock} قطع فقط</div>
        )}

        <button className="qa-add" onClick={handleAdd}>أضف للسلة</button>
        <a className="qa-details" href={`/product/${p.id}`}>عرض كل التفاصيل</a>
      </div>
    </div>
  );
}
