"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// تبويبات لوحة التحكم في مكان واحد — أي تعديل هنا بيظهر في كل الصفحات.
// العدّادات بتعد اللي محتاج منك تصرّف: طلبات لسه قيد الانتظار، وطلبات استرجاع جديدة.
const TABS = [
  { href: "/admin/dashboard", label: "لوحة المعلومات" },
  { href: "/admin", label: "المنتجات" },
  { href: "/admin/orders", label: "طلبات الشراء", badge: "orders" },
  { href: "/admin/returns", label: "الاسترجاع والاستبدال", badge: "returns" },
  { href: "/admin/archive", label: "الأرشيف" },
  { href: "/admin/coupons", label: "كوبونات الخصم" },
  { href: "/admin/hero", label: "هيرو الرئيسية" },
];

export default function AdminTabs({ active }) {
  const router = useRouter();
  const [counts, setCounts] = useState({ orders: 0, returns: 0 });

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [o, r] = await Promise.all([
          fetch("/api/orders").then((x) => (x.ok ? x.json() : [])),
          fetch("/api/returns").then((x) => (x.ok ? x.json() : [])),
        ]);
        if (!alive) return;
        setCounts({
          orders: Array.isArray(o) ? o.filter((x) => (x.status || "pending") === "pending").length : 0,
          returns: Array.isArray(r) ? r.filter((x) => (x.status || "new") === "new").length : 0,
        });
      } catch {
        /* العدّادات مش حرجة — لو فشلت الصفحة بتشتغل عادي */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="admin-tabs">
      {TABS.map((t) => {
        const isActive = t.href === active;
        const n = t.badge ? counts[t.badge] : 0;
        const chip =
          t.badge && n > 0 ? (
            <span className={`tab-count tc-${t.badge}`}>{n}</span>
          ) : null;

        return isActive ? (
          <span key={t.href} className="admin-tab active">
            {t.label}
            {chip}
          </span>
        ) : (
          <a key={t.href} href={t.href} className="admin-tab">
            {t.label}
            {chip}
          </a>
        );
      })}
      <button type="button" className="admin-logout" onClick={handleLogout}>
        تسجيل الخروج
      </button>
    </div>
  );
}
