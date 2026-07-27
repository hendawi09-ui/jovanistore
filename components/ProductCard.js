"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { IconSvg } from "@/lib/icons";
import { catCssVar, catLabel } from "@/lib/products";
import { useStore } from "@/lib/StoreContext";
import { showToast } from "./Toast";

export default function ProductCard({ p }) {
  const ref = useRef(null);
  const { addToCart } = useStore();
  const images = p.images && p.images.length > 0 ? p.images : [];
  const [active, setActive] = useState(0);
  const hasVariants = p.colors?.length > 0 || p.sizes?.length > 0;

  const touchX = useRef(null);
  const swiped = useRef(false);

  function onMove(e) {
    const card = ref.current;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(700px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-6px)`;
  }
  function onLeave() {
    ref.current.style.transform = "";
  }

  function onTouchStart(e) {
    if (images.length < 2) return;
    touchX.current = e.touches[0].clientX;
    swiped.current = false;
  }
  function onTouchMove(e) {
    if (touchX.current === null) return;
    const dx = e.touches[0].clientX - touchX.current;
    if (Math.abs(dx) > 10) swiped.current = true;
  }
  function onTouchEnd(e) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const threshold = 35;
    if (Math.abs(dx) > threshold) {
      e.preventDefault();
      if (dx < 0) {
        setActive((a) => (a + 1) % images.length);
      } else {
        setActive((a) => (a - 1 + images.length) % images.length);
      }
    }
    touchX.current = null;
  }
  function onMediaClick(e) {
    if (swiped.current) {
      e.preventDefault();
      swiped.current = false;
    }
  }

  return (
    <Link href={`/product/${p.id}`} className="card" ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}>
      <div
        className="card-media"
        style={{ "--c": `var(${catCssVar[p.cat]})` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onMediaClick}
      >
        {images.length > 0 ? (
          <img src={images[active]} alt={p.name} loading="lazy" />
        ) : (
          <div className="icon-box"><IconSvg name={p.icon} /></div>
        )}
        <div className="tag">{catLabel[p.cat]}</div>
        {images.length > 1 && (
          <div className="card-dots" onClick={(e) => e.preventDefault()}>
            {images.map((_, i) => (
              <button
                key={i}
                className={`card-dot ${i === active ? "active" : ""}`}
                aria-label={`صورة ${i + 1}`}
                onMouseEnter={() => setActive(i)}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActive(i); }}
              />
            ))}
          </div>
        )}
      </div>
      <div className="card-body" style={{ "--c": `var(${catCssVar[p.cat]})` }}>
        <h3>{p.name}</h3>
        <div className="desc">{p.desc}</div>
        <div className="card-foot">
          <div className="price">{p.price} ج.م</div>
          {hasVariants ? (
            <span className="add-btn add-btn-link">اختر التفاصيل</span>
          ) : (
            <button
              className="add-btn"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(p.id); showToast('أُضيف المنتج إلى سلتك ✓'); }}
            >
              أضف للسلة
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
