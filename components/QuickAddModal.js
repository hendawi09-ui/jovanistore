"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/StoreContext";
import {
  parseColor,
  parseSize,
  getStock,
  getTotalStock,
  hasDiscount,
} from "@/lib/products";
import { showToast } from "./Toast";

export default function QuickAddModal({ product: p, open, onClose }) {
  const { addToCart } = useStore();
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");

  const parsedColors = (p?.colors || []).map(parseColor);
  const rawSizes = (p?.sizes || []).map(parseSize);
  const trackingStock = getTotalStock(p) !== null;

  // المقاس متاح لو مش مشطوب يدويًا ولو فيه كمية في المخزون للّون المختار
  const parsedSizes = rawSizes.map((s) => {
    if (!s.available || !trackingStock) return s;
    return { ...s, available: getStock(p, color, s.name) > 0 };
  });

  // نختار أول لون تلقائيًا عند الفتح
  useEffect(() => {
    if (!open) return;
    setColor(parsedColors.length > 0 ? parsedColors[0].name : "");
  }, [open, p?.id]);

  // لما اللون يتغيّر، نختار أول مقاس متاح لهذا اللون
  useEffect(() => {
    if (!open) return;
    const first = parsedSizes.find((s) => s.available);
    setSize(first ? first.name : "");
  }, [open, color, p?.id]);

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

  const currentStock = trackingStock ? getStock(p, color, size) : null;

  function handleAdd() {
    if (parsedColors.length > 0 && !color) return showToast("من فضلك اختر اللون");
    if (parsedSizes.some((s) => s.available) && !size) return showToast("من فضلك اختر المقاس");
    if (trackingStock && (!currentStock || currentStock <= 0)) {
      return showToast("هذا الخيار غير متوفر حاليًا");
    }
    addToCart(p.id, 1, { color, size });
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

        {parsedColors.length > 0 && (
          <div className="qa-block">
            <label>اللون{color ? ` — ${color}` : ""}</label>
            <div className="swatch-row">
              {parsedColors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`swatch ${color === c.name ? "active" : ""} ${c.type ? "" : "swatch-text"}`}
                  onClick={() => setColor(c.name)}
                  title={c.name}
                >
                  {c.type === "image" ? (
                    <img src={c.swatch} alt={c.name} />
                  ) : c.type === "color" ? (
                    <span className="swatch-fill" style={{ background: c.swatch }} />
                  ) : (
                    c.name
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

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
