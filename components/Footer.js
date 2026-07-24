"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer id="about">
      <div className="footer-inner">
        <div>
          <h3>Jovani Store</h3>
          <p>متجر ملابس جاهزة رجالية ونسائية. تصميم بسيط، خامات مختارة، وأسعار توزن جودتها.</p>
        </div>
        <div className="footer-col">
          <h4>تسوّق</h4>
          <Link href="/?cat=men">رجالي</Link>
          <Link href="/?cat=women">نسائي</Link>
        </div>
        <div className="footer-col">
          <h4>الدعم</h4>
          <Link href="/orders">تتبع الطلب</Link>
          <a href="#about">تواصل معنا</a>
        </div>
      </div>
      <div className="footer-bottom">© 2026 Jovani Store. جميع الحقوق محفوظة.</div>
    </footer>
  );
}
