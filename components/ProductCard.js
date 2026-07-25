"use client";
import { useRef } from "react";
import Link from "next/link";
import { IconSvg } from "@/lib/icons";
import { catCssVar, catLabel } from "@/lib/products";
import { useStore } from "@/lib/StoreContext";
import { showToast } from "./Toast";

export default function ProductCard({ p }) {
  const ref = useRef(null);
  const { addToCart } = useStore();

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

  return (
    <Link href={`/product/${p.id}`} className="card" ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}>
      <div className="card-media" style={{ "--c": `var(${catCssVar[p.cat]})` }}>
        {p.image ? (
          <img src={p.image} alt={p.name} loading="lazy" />
        ) : (
          <div className="icon-box"><IconSvg name={p.icon} /></div>
        )}
        <div className="tag">{catLabel[p.cat]}</div>
      </div>
      <div className="card-body" style={{ "--c": `var(${catCssVar[p.cat]})` }}>
        <h3>{p.name}</h3>
        <div className="desc">{p.desc}</div>
        <div className="card-foot">
          <div className="price">{p.price} ج.م</div>
          <button
            className="add-btn"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(p.id); showToast('أُضيف المنتج إلى سلتك ✓'); }}
          >
            أضف للسلة
          </button>
        </div>
      </div>
    </Link>
  );
}
