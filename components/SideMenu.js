"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useStore } from "@/lib/StoreContext";

const links = [
  { href: "/", label: "الرئيسية", icon: "🏠" },
  { href: "/?cat=men", label: "رجالي", icon: "👔" },
  { href: "/?cat=women", label: "نسائي", icon: "👗" },
  { href: "/?cat=sale", label: "عروض وتخفيضات", icon: "🔥" },
  { href: "/orders", label: "طلباتي", icon: "📦" },
  { href: "/policies#contact", label: "تواصل معنا", icon: "💬" },
  { href: "/policies#shipping", label: "الشحن والاسترجاع", icon: "🚚" },
];

export default function SideMenu({ open, onClose }) {
  const { account } = useStore();

  // نمنع سكرول الصفحة اللي وراه لما المنيو مفتوحة
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  return (
    <>
      <div
        className={`side-menu-overlay ${open ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`side-menu ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="side-menu-head">
          <span>{account?.name ? `أهلًا ${account.name.trim().split(/\s+/)[0]}` : "أهلًا بيك"}</span>
          <button className="side-menu-close" onClick={onClose} aria-label="إغلاق المنيو" tabIndex={open ? 0 : -1}>✕</button>
        </div>
        <nav className="side-menu-links">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={onClose} tabIndex={open ? 0 : -1}>
              <span className="side-menu-icon" aria-hidden="true">{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
