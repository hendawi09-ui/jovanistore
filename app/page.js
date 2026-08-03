"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/StoreContext";
import { cats, catLabel, parseSize, matchesQuery, hasDiscount } from "@/lib/products";
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

  return (
    <>
      <HeroSlider />

      <div className="quick-cats">
        <Link href="/?cat=men" className="quick-cat qc-men">
          <span className="qc-emoji">👔</span>
          <span className="qc-label">رجالي</span>
        </Link>
        <Link href="/?cat=women" className="quick-cat qc-women">
          <span className="qc-emoji">👗</span>
          <span className="qc-label">نسائي</span>
        </Link>
        <Link href="/?cat=sale" className="quick-cat qc-sale">
          <span className="qc-emoji">🔥</span>
          <span className="qc-label">عروض وتخفيضات</span>
        </Link>
      </div>

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

      {newArrivals.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 8 }}>
            <h2>✨ وصل حديثًا</h2>
          </div>
          <div className="row-scroll">
            {newArrivals.map((p) => (
              <div className="row-scroll-item" key={p.id}>
                <ProductCard p={p} />
              </div>
            ))}
          </div>
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

      <div className="why-us">
        <div className="why-card">
          <span className="why-icon">🚚</span>
          <h3>شحن سريع</h3>
          <p>لجميع محافظات مصر خلال أيام قليلة</p>
        </div>
        <div className="why-card">
          <span className="why-icon">↩️</span>
          <h3>إرجاع مجاني</h3>
          <p>خلال 14 يوم من غير أي تعقيد</p>
        </div>
        <div className="why-card">
          <span className="why-icon">🔒</span>
          <h3>دفع آمن 100%</h3>
          <p>بياناتك محمية طول الوقت</p>
        </div>
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
