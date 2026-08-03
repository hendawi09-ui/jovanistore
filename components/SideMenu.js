"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
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
  const scrollY = useRef(0);

  // قفل تمرير الصفحة اللي وراه بنفس طريقة أدراج السلة والمفضلة —
  // overflow:hidden لوحدها مش كافية على متصفحات الموبايل، فبنستخدم position:fixed
  // مع حفظ مكان التمرير ورجوعه بعد الإغلاق عشان الصفحة ما تنطّش لفوق.
  useEffect(() => {
    const body = document.body;
    if (open) {
      scrollY.current = window.scrollY;
      body.style.position = "fixed";
      body.style.top = `-${scrollY.current}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
    } else if (body.style.position === "fixed") {
      const y = scrollY.current;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      window.scrollTo(0, y);
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
