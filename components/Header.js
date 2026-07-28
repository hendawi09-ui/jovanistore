"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/StoreContext";
import Logo from "./Logo";

export default function Header({ onOpenCart }) {
  const { cartCount } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);

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
            <Link href="/orders">طلباتي</Link>
          </div>
          <div className="nav-actions">
            <Link href="/#search" className="nav-icon-btn" aria-label="بحث">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </Link>
            <button className={`cart-btn ${bump ? "bump" : ""}`} onClick={onOpenCart} aria-label="سلة المشتريات">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L22 7H6" />
                <circle cx="9" cy="21" r="1.4" />
                <circle cx="18" cy="21" r="1.4" />
              </svg>
              <span className="cart-count">{cartCount}</span>
            </button>
          </div>
        </div>
      </nav>
      <div className="trust-bar">
        <div className="trust-inner">
          <span>🚚 <strong>شحن سريع</strong> لجميع محافظات مصر</span>
          <span>↩️ إرجاع مجاني خلال <strong>14 يومًا</strong></span>
          <span>🔒 دفع <strong>آمن 100%</strong></span>
        </div>
      </div>
    </>
  );
}
