"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/StoreContext";
import { cats } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

function HomeContent() {
  const { products } = useStore();
  const searchParams = useSearchParams();
  const [activeCat, setActiveCat] = useState("all");

  useEffect(() => {
    const c = searchParams.get("cat");
    if (c) setActiveCat(c);
  }, [searchParams]);

  const list = products.filter((p) => activeCat === "all" || p.cat === activeCat);

  return (
    <>
      <section className="hero">
        <div>
          <div className="hero-eyebrow">تشكيلة 2026 وصلت</div>
          <h1>مرحبًا بك في<br /><span className="arc-word">Jovani Store</span></h1>
          <p>ملابس رجالية ونسائية في مكان واحد، بجودة نثق بها وأسعار عادلة — اختر أسلوبك اليوم.</p>
          <div className="hero-ctas">
            <a href="#products" className="btn-primary">تسوّق الآن</a>
            <a href="#about" className="btn-ghost">تعرف علينا</a>
          </div>
        </div>
        <div className="hero-art">
          <svg viewBox="0 0 600 340" preserveAspectRatio="xMidYMid meet">
            <path className="arc-path" d="M 50 300 Q 300 40 550 300" pathLength="1000" stroke="#0D0D0D" strokeWidth="20" style={{ animationDelay: ".05s" }} />
            <path className="arc-path" d="M 90 300 Q 300 100 510 300" pathLength="1000" stroke="#E31B23" strokeWidth="20" style={{ animationDelay: ".25s" }} />
          </svg>
        </div>
      </section>

      <div className="cats">
        {cats.map((c) => (
          <button
            key={c.id}
            className={`cat-tab ${activeCat === c.id ? "active" : ""}`}
            style={c.color ? { "--c": c.color } : undefined}
            onClick={() => setActiveCat(c.id)}
          >
            {c.color && <span className="cat-dot"></span>}
            {c.label}
          </button>
        ))}
      </div>

      <div className="section-head" id="products">
        <h2>الأحدث في المتجر</h2>
        <span>{list.length} منتج</span>
      </div>
      <div className="grid">
        {list.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: "1/-1" }}>لا توجد منتجات في هذا القسم حاليًا.</div>
        ) : (
          list.map((p) => <ProductCard key={p.id} p={p} />)
        )}
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
