"use client";
import Link from "next/link";
import { contact, hasWhatsApp } from "@/lib/siteConfig";
import { useStore } from "@/lib/StoreContext";

export default function Footer() {
  const { storeMode } = useStore();
  return (
    <footer id="about">
      <div className="footer-inner">
        <div>
          <h3>Jovani Store</h3>
          <p>متجر ملابس جاهزة رجالية ونسائية. تصميم بسيط، خامات مختارة، وأسعار توزن جودتها.</p>
          <div className="footer-social">
            {hasWhatsApp() && (
            <a
              href={`https://wa.me/${contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="واتساب"
              title="تواصل معنا على واتساب"
              className="social-icon wa"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.95L2 22l5.2-1.5A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 1 1-4.1 15.06l-.3-.18-3.1.9.9-3-.2-.3A8.1 8.1 0 0 1 12.04 3.8Zm4.7 10.28c-.25-.13-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12s-.64.8-.79.97c-.14.16-.29.18-.54.06a6.63 6.63 0 0 1-3.3-2.88c-.25-.43.25-.4.71-1.33.08-.16.04-.3-.02-.42-.06-.13-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.42.06-.64.3-.22.25-.85.83-.85 2.02s.87 2.34 1 2.5c.12.17 1.71 2.61 4.15 3.66 1.55.67 2.15.72 2.92.61.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z" />
              </svg>
            </a>
            )}
            <a
              href={`https://instagram.com/${contact.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="إنستجرام"
              title="تابعنا على إنستجرام"
              className="social-icon ig"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </div>
        </div>
        <div className="footer-col">
          <h4>تسوّق</h4>
          {/* في وضع القسم الواحد بنخفي رابط القسم التاني */}
          {storeMode !== "women" && <Link href="/?cat=men">رجالي</Link>}
          {storeMode !== "men" && <Link href="/?cat=women">نسائي</Link>}
        </div>
        <div className="footer-col">
          <h4>الدعم</h4>
          <Link href="/orders">تتبع الطلب</Link>
          <Link href="/policies#contact">تواصل معنا</Link>
          <Link href="/policies#shipping">الشحن</Link>
        </div>
        <div className="footer-col">
          <h4>السياسات</h4>
          <Link href="/policies#returns">الاستبدال والإرجاع</Link>
          <Link href="/policies#privacy">الخصوصية</Link>
        </div>
      </div>
      <div className="footer-bottom">© 2026 Jovani Store. جميع الحقوق محفوظة.</div>
    </footer>
  );
}
