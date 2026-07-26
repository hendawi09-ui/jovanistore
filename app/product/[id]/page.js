"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/StoreContext";
import { IconSvg } from "@/lib/icons";
import { catCssVar, catLabel } from "@/lib/products";
import { showToast } from "@/components/Toast";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { products, addToCart } = useStore();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const p = products.find((x) => x.id == id);

  const touchX = useRef(null);

  function onTouchStart(e, len) {
    if (len < 2) return;
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e, len) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const threshold = 35;
    if (Math.abs(dx) > threshold) {
      if (dx < 0) {
        setActive((a) => (a + 1) % len);
      } else {
        setActive((a) => (a - 1 + len) % len);
      }
    }
    touchX.current = null;
  }

  if (!p) {
    return (
      <div className="empty-state">
        المنتج غير موجود. <Link href="/" style={{ color: "var(--red)", fontWeight: 700 }}>عودة للرئيسية</Link>
      </div>
    );
  }

  const images = p.images && p.images.length > 0 ? p.images : [];

  return (
    <div className="pd">
      <div>
        <div
          className="pd-media"
          style={{ "--c": `var(${catCssVar[p.cat]})` }}
          onTouchStart={(e) => onTouchStart(e, images.length)}
          onTouchEnd={(e) => onTouchEnd(e, images.length)}
        >
          {images.length > 0 ? (
            <img src={images[active]} alt={p.name} />
          ) : (
            <div className="icon-box"><IconSvg name={p.icon} /></div>
          )}
        </div>
        {images.length > 1 && (
          <div className="pd-thumbs">
            {images.map((src, i) => (
              <button
                key={i}
                className={`pd-thumb ${i === active ? "active" : ""}`}
                onClick={() => setActive(i)}
                aria-label={`صورة ${i + 1}`}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="pd-info">
        <div className="breadcrumb"><Link href="/">الرئيسية</Link> / {catLabel[p.cat]}</div>
        <div className="tag" style={{ "--c": `var(${catCssVar[p.cat]})` }}>{catLabel[p.cat]}</div>
        <h1>{p.name}</h1>
        <span className="price">{p.price} ج.م</span>
        <p className="desc">{p.desc}</p>
        <div className="stepper">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span>{qty}</span>
          <button onClick={() => setQty((q) => q + 1)}>+</button>
        </div>
        <button
          className="btn-primary"
          onClick={() => { addToCart(p.id, qty); showToast("أُضيف المنتج إلى سلتك ✓"); }}
        >
          أضف إلى السلة
        </button>
      </div>
    </div>
  );
}
