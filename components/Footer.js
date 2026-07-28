"use client";
import Link from "next/link";
import { contact } from "@/lib/siteConfig";

export default function Footer() {
  return (
    <footer id="about">
      <div className="footer-inner">
        <div>
          <h3>Jovani Store</h3>
          <p>متجر ملابس جاهزة رجالية ونسائية. تصميم بسيط، خامات مختارة، وأسعار توزن جودتها.</p>
          <div className="footer-social">
            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer">واتساب</a>
            <a href={`https://instagram.com/${contact.instagram}`} target="_blank" rel="noopener noreferrer">
              إنستجرام
            </a>
          </div>
        </div>
        <div className="footer-col">
          <h4>تسوّق</h4>
          <Link href="/?cat=men">رجالي</Link>
          <Link href="/?cat=women">نسائي</Link>
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
