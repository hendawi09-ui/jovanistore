"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/StoreContext";
import Logo from "./Logo";
import SideMenu from "./SideMenu";

export default function Header({ onOpenCart, onOpenFavorites }) {
  const { cartCount, favCount, account } = useStore();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (cartCount === 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [cartCount]);

  function submitSearch(e) {
    e.preventDefault();
    const q = headerQuery.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

  return (
    <>
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-inner">
          <Link href="/" className="logo">
            <Logo size="compact" />
          </Link>

          {/* شريط البحث — في منتصف الهيدر على الديسك توب */}
          <form className="nav-search" onSubmit={submitSearch} role="search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={headerQuery}
              onChange={(e) => setHeaderQuery(e.target.value)}
              placeholder="ابحث عن منتج، لون، أو مقاس..."
              aria-label="بحث في المنتجات"
            />
          </form>

          <div className="nav-actions">
            {/* أيقونة حسابي — مكان زرار البحث القديم */}
            <Link
              href="/orders"
              className="nav-icon-btn"
              aria-label={account?.name ? `حساب ${account.name}` : "حسابي"}
              title={account?.name ? `أهلًا ${account.name.trim().split(/\s+/)[0]}` : "حسابي"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-6.5 8-6.5S20 17 20 21" />
              </svg>
            </Link>
            <button className="fav-btn" onClick={onOpenFavorites} aria-label="المفضلة">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
              </svg>
              {favCount > 0 && <span className="fav-count">{favCount}</span>}
            </button>
            <button className={`cart-btn ${bump ? "bump" : ""}`} onClick={onOpenCart} aria-label="سلة المشتريات">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L22 7H6" />
                <circle cx="9" cy="21" r="1.4" />
                <circle cx="18" cy="21" r="1.4" />
              </svg>
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
          </div>
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="فتح المنيو"
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>
      <div className="trust-bar">
        <div className="trust-inner">
          <span>🚚 <strong>شحن سريع</strong> لجميع محافظات مصر</span>
          <span>↩️ إرجاع مجاني خلال <strong>14 يومًا</strong></span>
          <span>🔒 دفع <strong>آمن 100%</strong></span>
          {/* نسخة مكررة عشان الحركة تبقى متصلة من غير فراغ على الموبايل */}
          <span aria-hidden="true">🚚 <strong>شحن سريع</strong> لجميع محافظات مصر</span>
          <span aria-hidden="true">↩️ إرجاع مجاني خلال <strong>14 يومًا</strong></span>
          <span aria-hidden="true">🔒 دفع <strong>آمن 100%</strong></span>
        </div>
      </div>
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
