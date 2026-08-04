"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { IconSvg } from "@/lib/icons";
import { catCssVar, getTotalStock, hasDiscount, discountPercent } from "@/lib/products";
import { useStore } from "@/lib/StoreContext";
import { showToast } from "./Toast";
import QuickAddModal from "./QuickAddModal";

export default function ProductCard({ p, swipeEnabled = true }) {
  const ref = useRef(null);
  const { addToCart, isFavorite, toggleFavorite } = useStore();
  const images = p.images && p.images.length > 0 ? p.images : [];
  const [active, setActive] = useState(0);
  const [quickOpen, setQuickOpen] = useState(false);
  const hasVariants = p.sizes?.length > 0; // اللون بقى منتج مستقل، فالاختيار السريع للمقاسات بس
  const soldOut = getTotalStock(p) === 0;

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
    if (!swipeEnabled || images.length < 2) return;
    touchX.current = e.touches[0].clientX;
    swiped.current = false;
  }
  function onTouchMove(e) {
    if (!swipeEnabled || touchX.current === null) return;
    const dx = e.touches[0].clientX - touchX.current;
    if (Math.abs(dx) > 10) swiped.current = true;
  }
  function onTouchEnd(e) {
    if (!swipeEnabled || touchX.current === null) return;
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

  // لما تبديل الصور باللمس يكون متعطّل (جوه الصفوف المتمررة أفقيًا)، مابنربطش
  // معالجات اللمس أصلًا وبنسيب المتصفح يتصرف — ده بيمنع أي تداخل مع تمرير الشريط
  const touchHandlers = swipeEnabled
    ? { onTouchStart, onTouchMove, onTouchEnd }
    : {};

  return (
    <>
      <Link href={`/product/${p.id}`} className="card" ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}>
      <div
        className="card-media"
        style={{ "--c": `var(${catCssVar[p.cat]})`, touchAction: swipeEnabled ? "pan-y" : "pan-x pan-y" }}
        {...touchHandlers}
        onClick={onMediaClick}
      >
        {images.length > 0 ? (
          <Image
            src={images[active]}
            alt={p.name}
            fill
            // البطاقات: عمودين على الموبايل، وحتى 5 أعمدة على الشاشات الكبيرة
            sizes="(max-width:920px) 50vw, (max-width:1050px) 33vw, (max-width:1280px) 25vw, 20vw"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="icon-box"><IconSvg name={p.icon} /></div>
        )}
        <button
          className={`fav-toggle ${isFavorite(p.id) ? "active" : ""}`}
          aria-label={isFavorite(p.id) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(p.id);
            showToast(isFavorite(p.id) ? "أُزيل من المفضلة" : "أُضيف إلى المفضلة ♡");
          }}
        >
          <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </button>
        {hasDiscount(p) && !soldOut && <div className="disc-badge">-{discountPercent(p)}%</div>}
        {soldOut && <div className="soldout-overlay">نفدت الكمية</div>}
        {!soldOut && (
          <button
            className="cart-toggle"
            aria-label="أضف للسلة"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // لو المنتج عنده ألوان أو مقاسات، بنفتح نافذة سريعة للاختيار قبل الإضافة
              if (hasVariants) {
                setQuickOpen(true);
              } else {
                addToCart(p.id);
                showToast("أُضيف المنتج إلى سلتك ✓");
              }
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L22 7H6" />
              <circle cx="9" cy="21" r="1.4" />
              <circle cx="18" cy="21" r="1.4" />
            </svg>
          </button>
        )}
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
          <div className="price">
            {hasDiscount(p) ? (
              <>
                <span className="price-sale">{p.salePrice} ج.م</span>
                <s className="price-old">{p.price}</s>
              </>
            ) : (
              `${p.price} ج.م`
            )}
          </div>
          {soldOut && <span className="add-btn add-btn-link soldout-label">نفدت الكمية</span>}
        </div>
      </div>
      </Link>
      <QuickAddModal product={p} open={quickOpen} onClose={() => setQuickOpen(false)} />
    </>
  );
}
