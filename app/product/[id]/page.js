"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/StoreContext";
import { IconSvg } from "@/lib/icons";
import { catCssVar, catLabel, parseSize, getStock, getTotalStock, hasDiscount, discountPercent } from "@/lib/products";
import { showToast } from "@/components/Toast";
import ShareButton from "@/components/ShareButton";
import SuggestedProducts from "@/components/SuggestedProducts";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { products, productsLoaded, addToCart, startBuyNow } = useStore();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [size, setSize] = useState("");
  const p = products.find((x) => x.id == id && x.published !== false);

  const productColor = p?.colorName || "";
  const rawSizes = (p?.sizes || []).map(parseSize);
  const trackingStock = getTotalStock(p) !== null;

  // المقاس يعتبر متاح لو مش مشطوب يدويًا ولو فيه كمية في المخزون للّون المختار
  const parsedSizes = rawSizes.map((s) => {
    if (!s.available) return s;
    if (!trackingStock) return s;
    const left = getStock(p, productColor, s.name);
    return { ...s, available: left > 0, left };
  });

  const currentStock = trackingStock ? getStock(p, productColor, size) : null;
  const soldOut = trackingStock && getTotalStock(p) === 0;

  // تسجيل زيارة للمنتج (مرة واحدة بس لكل فتح صفحة، مش مع كل تغيير في اللون/المقاس)
  const viewedRef = useRef(null);
  useEffect(() => {
    if (!p || viewedRef.current === p.id) return;
    viewedRef.current = p.id;
    fetch(`/api/products/${p.id}/view`, { method: "POST" }).catch(() => {});
  }, [p?.id]);

  // لما اللون يتغيّر، نختار أول مقاس متاح فعليًا لهذا اللون
  useEffect(() => {
    if (!p) return;
    const firstAvailable = parsedSizes.find((s) => s.available);
    setSize(firstAvailable ? firstAvailable.name : "");
    setQty(1);
  }, [p?.id]);

  // نمنع الكمية من تجاوز المتاح في المخزون
  useEffect(() => {
    if (currentStock !== null && currentStock > 0 && qty > currentStock) setQty(currentStock);
  }, [currentStock, qty]);

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

  // لسه بنحمّل المنتجات — منقولش "غير موجود" غير لما نتأكد فعلًا
  if (!productsLoaded) {
    return <div className="empty-state">جارِ التحميل...</div>;
  }

  if (!p) {
    return (
      <div className="empty-state">
        المنتج غير موجود. <Link href="/" style={{ color: "var(--red)", fontWeight: 700 }}>عودة للرئيسية</Link>
      </div>
    );
  }

  // كل لون بقى منتج مستقل بصفحته — فالمعرض بيعرض صور اللون ده بس
  const images = p.images && p.images.length > 0 ? p.images : [];

  // ألوان نفس القطعة = المنتجات اللي بنفس group_key (بما فيهم المنتج الحالي)
  const siblings = p.groupKey
    ? products.filter((x) => x.groupKey === p.groupKey && x.published !== false)
    : [];

  // لازم العميل يختار لون ومقاس (لو المنتج بيوفرهم) قبل الشراء أو الإضافة للسلة
  function missingSelection() {
    if (soldOut) return "نفدت الكمية من هذا المنتج";
    if (parsedSizes.some((s) => s.available) && !size) return "من فضلك اختر المقاس أولًا";
    if (trackingStock && (currentStock === null || currentStock <= 0)) return "هذا الخيار غير متوفر حاليًا";
    if (currentStock !== null && qty > currentStock) return `المتاح ${currentStock} قطعة فقط`;
    return null;
  }

  function handleAddToCart() {
    const msg = missingSelection();
    if (msg) return showToast(msg);
    addToCart(p.id, qty, { color: productColor, size });
    showToast("أُضيف المنتج إلى سلتك ✓");
  }

  function handleBuyNow() {
    const msg = missingSelection();
    if (msg) return showToast(msg);
    startBuyNow(p.id, qty, { color: productColor, size });
    router.push("/checkout");
  }

  return (
    <>
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
        <div className="pd-price">
          {hasDiscount(p) ? (
            <>
              <span className="price price-sale">{p.salePrice} ج.م</span>
              <s className="price-old">{p.price} ج.م</s>
              <span className="disc-chip">وفّر {discountPercent(p)}%</span>
            </>
          ) : (
            <span className="price">{p.price} ج.م</span>
          )}
        </div>
        <p className="desc">{p.desc}</p>

        {siblings.length > 1 && (
          <div className="variant-block">
            <label>اللون{p.colorName ? ` — ${p.colorName}` : ""}</label>
            <div className="swatch-row">
              {siblings.map((sib) => (
                <Link
                  className="swatch-item"
                  key={sib.id}
                  href={`/product/${sib.id}`}
                  scroll={false}
                  title={sib.colorName || sib.name}
                >
                  <span className={`swatch ${sib.id === p.id ? "active" : ""}`}>
                    {sib.images && sib.images[0] ? (
                      <img src={sib.images[0]} alt={sib.colorName || sib.name} />
                    ) : (
                      <span className="swatch-fill" style={{ background: "var(--paper-dim)" }} />
                    )}
                  </span>
                  <span className={`swatch-name ${sib.id === p.id ? "current" : ""}`}>
                    {sib.colorName || sib.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {parsedSizes.length > 0 && (
          <div className="variant-block">
            <label>المقاس{size ? ` — ${size}` : ""}</label>
            <div className="size-row">
              {parsedSizes.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  disabled={!s.available}
                  className={`size-box ${size === s.name ? "active" : ""} ${!s.available ? "unavailable" : ""}`}
                  onClick={() => s.available && setSize(s.name)}
                  title={s.available ? s.name : `${s.name} — غير متوفر`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {trackingStock && (
          <div className={`stock-note ${soldOut || currentStock === 0 ? "out" : currentStock <= 3 ? "low" : ""}`}>
            {soldOut
              ? "نفدت الكمية بالكامل"
              : currentStock === 0
              ? "هذا الخيار غير متوفر حاليًا"
              : currentStock <= 3
              ? `الكمية محدودة — باقي ${currentStock} قطع فقط`
              : "متوفر في المخزون"}
          </div>
        )}

        <div className="stepper">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span>{qty}</span>
          <button
            onClick={() => setQty((q) => (currentStock !== null ? Math.min(currentStock, q + 1) : q + 1))}
            disabled={currentStock !== null && qty >= currentStock}
          >
            +
          </button>
        </div>
        <div className="pd-actions">
          <button className="btn-primary" onClick={handleBuyNow} disabled={soldOut || currentStock === 0}>
            اشترِ الآن
          </button>
          <button className="btn-outline" onClick={handleAddToCart} disabled={soldOut || currentStock === 0}>
            أضف إلى السلة
          </button>
        </div>

        <ShareButton title={p.name} text={`${hasDiscount(p) ? p.salePrice : p.price} ج.م — Jovani Store`} />
      </div>
    </div>

    <SuggestedProducts currentProduct={p} />
    </>
  );
}
