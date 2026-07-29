"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/StoreContext";

export default function FloatingActions({ onOpenCart, onOpenFavorites }) {
  const { cartCount, favCount } = useStore();
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (cartCount === 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [cartCount]);

  return (
    <div className="float-stack">
      <button
        className={`float-btn float-cart ${bump ? "bump" : ""}`}
        onClick={onOpenCart}
        aria-label="سلة المشتريات"
        title="سلة المشتريات"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L22 7H6" />
          <circle cx="9" cy="21" r="1.4" />
          <circle cx="18" cy="21" r="1.4" />
        </svg>
        {cartCount > 0 && <span className="float-count">{cartCount}</span>}
      </button>

      <button
        className="float-btn float-fav"
        onClick={onOpenFavorites}
        aria-label="المفضلة"
        title="المفضلة"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
        {favCount > 0 && <span className="float-count fav">{favCount}</span>}
      </button>
    </div>
  );
}
