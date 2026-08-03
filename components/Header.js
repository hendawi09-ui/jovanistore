"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/StoreContext";
import { handleSearchNav } from "@/lib/searchFocus";
import Logo from "./Logo";
import SideMenu from "./SideMenu";

export default function Header({ onOpenCart, onOpenFavorites }) {
  const { cartCount, favCount, account } = useStore();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <>
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-inner">
          <Link href="/" className="logo">
            <Logo size="compact" />
          </Link>
          <div className="nav-links">
            <Link href="/">الرئيسية</Link>
            <Link href="/orders">
              {account?.name ? `أهلًا ${account.name.trim().split(/\s+/)[0]}` : "حسابي"}
            </Link>
          </div>
          <div className="nav-actions">
            <a href="/#search" className="nav-icon-btn" aria-label="بحث" onClick={(e) => handleSearchNav(e, router)}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </a>
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
