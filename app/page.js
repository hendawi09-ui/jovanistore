"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/StoreContext";
import { cats, catLabel, parseSize, matchesQuery, hasDiscount } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import HeroSlider from "@/components/HeroSlider";
import NewArrivalsRow from "@/components/NewArrivalsRow";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";

function HomeContent() {
  const { products, productsLoaded } = useStore();
  const searchParams = useSearchParams();
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");
  const [bestIds, setBestIds] = useState([]);

  // بنجيب ترتيب الأكثر مبيعًا (محسوب من الطلبات الفعلية على السيرفر)
  useEffect(() => {
    fetch("/api/best-sellers")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setBestIds(Array.isArray(d) ? d.map((x) => x.id) : []))
      .catch(() => setBestIds([]));
  }, []);

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
    if (activeCat === "sale") {
      if (!hasDiscount(p)) return false;
    } else if (activeCat !== "all" && p.cat !== activeCat) {
      return false;
    }
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

  // أحدث 8 منتجات (حسب تاريخ الإضافة) — بتظهر بس في العرض الافتراضي من غير فلترة أو بحث
  const newArrivals = !q && activeCat === "all"
    ? [...products]
        .filter((p) => p.published !== false)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 8)
    : [];

  // الأكثر مبيعًا — بترتيب المبيعات الفعلية الجاي من السيرفر
  const bestSellers = !q && activeCat === "all"
    ? bestIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p) => p && p.published !== false)
    : [];

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

      {!productsLoaded ? (
        // بنحجز مساحة صف "وصل حديثًا" وهو بيحمّل عشان الصفحة ما تقفزش
        <>
          <div className="section-head" style={{ marginTop: 8 }}>
            <h2>✨ وصل حديثًا</h2>
          </div>
          <div className="row-scroll-wrap">
            <div className="row-scroll">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="row-scroll-item" key={i}>
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        newArrivals.length > 0 && (
          <>
            <div className="section-head" style={{ marginTop: 8 }}>
              <h2>✨ وصل حديثًا</h2>
            </div>
            <NewArrivalsRow products={newArrivals} />
          </>
        )
      )}

      {bestSellers.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 8 }}>
            <h2>⭐ الأكثر مبيعًا</h2>
          </div>
          <NewArrivalsRow products={bestSellers} />
        </>
      )}

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
        {productsLoaded && <span>{list.length} منتج</span>}
      </div>
      <div className="grid">
        {!productsLoaded ? (
          // لسه بنحمّل — بنحجز مساحة البطاقات بدل ما نقول "لا توجد منتجات" بالغلط
          Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)
        ) : list.length === 0 ? (
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
