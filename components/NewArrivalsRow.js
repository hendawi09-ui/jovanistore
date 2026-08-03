"use client";
import { useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";

// صف "وصل حديثًا": في الديسكتوب شريط لا نهائي بأسهم، وفي الموبايل تمرير باللمس عادي بـ8 منتجات بس.
// الحاوية بتتفرض عليها direction:ltr (زي سلايدر الهيرو بالظبط) عشان يبقى scrollLeft
// له نفس المعنى في كل المتصفحات، وكل بطاقة جواها direction:rtl عشان النص العربي يتقرأ صح.
// وعشان الترتيب البصري يفضل صح للعربي (الأحدث على أقصى اليمين)، بنعكس ترتيب العناصر.
export default function NewArrivalsRow({ products }) {
  const trackRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const n = products.length;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // في الديسكتوب بنكرر القائمة 3 مرات عشان يحس المستخدم إنه شريط لا نهائي وهو بيدوس على الأسهم
  const visualList = isDesktop
    ? [...products, ...products, ...products].reverse()
    : [...products].reverse();

  // نبدأ من موضع يورّي أحدث المنتجات على طول من غير ما يحتاج يمرر — في الديسكتوب من نص
  // النسخة المكررة (عشان يفضل فيه مجال يمرر فيه في الاتجاهين)، وفي الموبايل من أقصى النهاية.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (isDesktop) {
      el.scrollLeft = el.scrollWidth / 3;
    } else {
      el.scrollLeft = el.scrollWidth - el.clientWidth;
    }
  }, [isDesktop, n]);

  function scrollByCard(dir) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector(".row-scroll-item");
    const step = card ? card.getBoundingClientRect().width + 18 : 260;
    el.scrollBy({ left: dir * step, behavior: "smooth" });

    // لو قربنا من أي طرف، بعد لحظة نرجّع الموضع لنص الشريط المكرر من غير أنيميشن
    // عشان المستخدم يحس إنه بيفضل يمرر من غير ما يوصل لنهاية فعلية
    setTimeout(() => {
      const max = el.scrollWidth - el.clientWidth;
      const third = el.scrollWidth / 3;
      if (el.scrollLeft <= 4 || el.scrollLeft >= max - 4) {
        el.scrollTo({ left: third, behavior: "auto" });
      }
    }, 380);
  }

  return (
    <div className="row-scroll-wrap">
      {/* السهم اللي شكله لليمين = رجوع للخلف (نحو بداية القراءة العربية) */}
      <button className="row-nav row-nav-prev" onClick={() => scrollByCard(1)} aria-label="السابق">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <div className="row-scroll" ref={trackRef}>
        {visualList.map((p, i) => (
          <div className="row-scroll-item" key={`${p.id}-${i}`}>
            <ProductCard p={p} swipeEnabled={false} />
          </div>
        ))}
      </div>

      {/* السهم اللي شكله للشمال = تقدّم للأمام (نحو باقي المنتجات) */}
      <button className="row-nav row-nav-next" onClick={() => scrollByCard(-1)} aria-label="التالي">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
    </div>
  );
}
