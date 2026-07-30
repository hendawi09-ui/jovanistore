"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/StoreContext";
import { handleSearchNav } from "@/lib/searchFocus";

// شريط تنقل سفلي — بيظهر على الموبايل فقط (مخفي على الديسكتوب من الـ CSS)
export default function MobileNav() {
  const { account } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  const firstName = account?.name ? account.name.trim().split(/\s+/)[0] : null;
  const isHome = pathname === "/";
  const isAccount = pathname === "/orders" || pathname.startsWith("/account");

  return (
    <nav className="mobile-nav" aria-label="التنقل السريع">
      <Link href="/" className={`mnav-item ${isHome ? "active" : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
        <span>الرئيسية</span>
      </Link>

      <a href="/#search" className="mnav-item" onClick={(e) => handleSearchNav(e, router)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <span>بحث</span>
      </a>

      <Link href="/orders" className={`mnav-item ${isAccount ? "active" : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 3.6-6.5 8-6.5S20 17 20 21" />
        </svg>
        <span>{firstName ? `أهلًا ${firstName}` : "حسابي"}</span>
      </Link>
    </nav>
  );
}
