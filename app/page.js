"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/StoreContext";
import { cats, catLabel, parseSize, matchesQuery } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

function HomeContent() {
  const { products } = useStore();
  const searchParams = useSearchParams();
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const c = searchParams.get("cat");
    if (c) setActiveCat(c);
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  const q = query.trim();
  const list = products.filter((p) => {
    if (p.published === false) return false;
    if (activeCat !== "all" && p.cat !== activeCat) return false;
    if (!q) return true;
    const haystack = [
      p.name,
      p.desc,
      catLabel[p.cat],
      p.colorName,
      ...(p.sizes || []).map((s) => parseSize(s).name),
    ]
      .filter(Boolean)
      .join(" ");
    // كل كلمات البحث لازم تظهر (أي عدد كلمات)، مع تجاهل اختلاف شكل الحروف العربية
    return matchesQuery(haystack, q);
  });

  return (
    <>
      <section className="hero">
        <div>
          <div className="hero-eyebrow"><span className="pulse-dot"></span>تشكيلة 2026 وصلت</div>
          <h1>مرحبًا بك في<br /><span className="arc-word">Jovani Store</span></h1>
          <p>ملابس رجالية ونسائية في مكان واحد، بجودة نثق بها وأسعار عادلة — اختر أسلوبك اليوم.</p>
          <div className="hero-ctas">
            <a href="#products" className="btn-primary">تسوّق الآن</a>
            <a href="#about" className="btn-ghost">تعرف علينا</a>
          </div>
        </div>
        <div className="hero-art">
          <svg viewBox="0 0 600 340" preserveAspectRatio="xMidYMid meet">
            <path className="arc-path" d="M 40 300 Q 300 20 560 300" pathLength="1000" stroke="#0D0D0D" strokeWidth="26" style={{ animationDelay: ".05s" }} />
            <path className="arc-path" d="M 85 300 Q 300 90 515 300" pathLength="1000" stroke="#E31B23" strokeWidth="26" style={{ animationDelay: ".25s" }} />
          </svg>
        </div>
      </section>

      <div className="search-wrap" id="search">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            id="site-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن منتج، لون، أو مقاس..."
            aria-label="بحث في المنتجات"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery("")} aria-label="مسح البحث">✕</button>
          )}
        </div>
      </div>

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
        <h2>{q ? "نتائج البحث" : "الأحدث في المتجر"}</h2>
        <span>{list.length} منتج</span>
      </div>
      <div className="grid">
        {list.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: "1/-1" }}>
            {q ? (
              <>
                لا توجد نتائج لـ &laquo;{query}&raquo;.<br />
                <button className="btn-ghost" style={{ marginTop: 16 }} onClick={() => { setQuery(""); setActiveCat("all"); }}>
                  عرض كل المنتجات
                </button>
              </>
            ) : (
              "لا توجد منتجات في هذا القسم حاليًا."
            )}
          </div>
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
