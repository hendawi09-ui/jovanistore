"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/StoreContext";
import { cats, catLabel, parseSize, matchesQuery } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import HeroSlider from "@/components/HeroSlider";

function HomeContent() {
  const { products } = useStore();
  const searchParams = useSearchParams();
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const c = searchParams.get("cat");
    if (c) {
      setActiveCat(c);
      // النزول التلقائي لقسم المنتجات لو المستخدم جاي من رابط فيه قسم محدد (زي زرار السلايدر)
      setTimeout(() => {
        document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
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
      <HeroSlider />

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
