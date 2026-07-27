"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/StoreContext";
import { IconSvg } from "@/lib/icons";
import { catCssVar, catLabel, parseColor, parseSize } from "@/lib/products";
import { showToast } from "@/components/Toast";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { products, addToCart, startBuyNow } = useStore();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const p = products.find((x) => x.id == id && x.published !== false);

  const parsedColors = (p?.colors || []).map(parseColor);
  const parsedSizes = (p?.sizes || []).map(parseSize);

  // اختيار أول لون وأول مقاس متاح تلقائيًا لما يتوفر المنتج
  useEffect(() => {
    if (!p) return;
    const colorList = (p.colors || []).map(parseColor);
    const sizeList = (p.sizes || []).map(parseSize);
    if (colorList.length > 0) setColor(colorList[0].name);
    const firstAvailable = sizeList.find((s) => s.available);
    if (firstAvailable) setSize(firstAvailable.name);
  }, [p?.id]);

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

  // لازم العميل يختار لون ومقاس (لو المنتج بيوفرهم) قبل الشراء أو الإضافة للسلة
  function missingSelection() {
    if (parsedColors.length > 0 && !color) return "من فضلك اختر اللون أولًا";
    if (parsedSizes.some((s) => s.available) && !size) return "من فضلك اختر المقاس أولًا";
    return null;
  }

  function handleAddToCart() {
    const msg = missingSelection();
    if (msg) return showToast(msg);
    addToCart(p.id, qty, { color, size });
    showToast("أُضيف المنتج إلى سلتك ✓");
  }

  function handleBuyNow() {
    const msg = missingSelection();
    if (msg) return showToast(msg);
    startBuyNow(p.id, qty, { color, size });
    router.push("/checkout");
  }

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

        {parsedColors.length > 0 && (
          <div className="variant-block">
            <label>اللون{color ? ` — ${color}` : ""}</label>
            <div className="swatch-row">
              {parsedColors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`swatch ${color === c.name ? "active" : ""} ${c.type ? "" : "swatch-text"}`}
                  onClick={() => setColor(c.name)}
                  title={c.name}
                  aria-label={c.name}
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

        <div className="stepper">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span>{qty}</span>
          <button onClick={() => setQty((q) => q + 1)}>+</button>
        </div>
        <div className="pd-actions">
          <button className="btn-primary" onClick={handleBuyNow}>
            اشترِ الآن
          </button>
          <button className="btn-outline" onClick={handleAddToCart}>
            أضف إلى السلة
          </button>
        </div>
      </div>
    </div>
  );
}
