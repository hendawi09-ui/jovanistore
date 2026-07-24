"use client";
import { useState } from "react";
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
  const p = products.find((x) => x.id == id);

  if (!p) {
    return (
      <div className="empty-state">
        المنتج غير موجود. <Link href="/" style={{ color: "var(--red)", fontWeight: 700 }}>عودة للرئيسية</Link>
      </div>
    );
  }

  return (
    <div className="pd">
      <div className="pd-media" style={{ "--c": `var(${catCssVar[p.cat]})` }}>
        <div className="icon-box"><IconSvg name={p.icon} /></div>
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
