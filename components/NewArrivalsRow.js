"use client";
import { useCallback, useEffect, useRef } from "react";
import ProductCard from "./ProductCard";

// صف "وصل حديثًا": شريط لا نهائي في الديسكتوب والموبايل.
// الفكرة: بنكرر قائمة المنتجات 3 مرات، وبنبدأ من النسخة الأوسط. أول ما المستخدم
// (بالسحب أو بالأسهم) يقرب من أي طرف، بنرجّعه لنفس المكان في النسخة الأوسط من غير
// أنيميشن — فبيحس إنه بيمرر لما لا نهاية في الاتجاهين.
//
// الحاوية عليها direction:ltr (زي سلايدر الهيرو) عشان scrollLeft يبقى له نفس المعنى
// في كل المتصفحات، وكل بطاقة جواها direction:rtl عشان النص العربي يتقرأ صح.
// وبنعكس ترتيب العناصر عشان الأحدث يظهر على أقصى اليمين، متسق مع القراءة العربية.
export default function NewArrivalsRow({ products }) {
  const trackRef = useRef(null);
  const busy = useRef(false); // بنمنع تصحيح الموضع وهو بيصحّح بالفعل

  const visualList = [...products, ...products, ...products].reverse();

  // طول النسخة الواحدة من القائمة بالبكسل
  const oneSetWidth = useCallback(() => {
    const el = trackRef.current;
    return el ? el.scrollWidth / 3 : 0;
  }, []);

  // نبدأ من النسخة الأوسط
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => { el.scrollLeft = oneSetWidth(); });
    return () => cancelAnimationFrame(id);
  }, [products.length, oneSetWidth]);

  // التصحيح اللانهائي — بيشتغل مع السحب باللمس ومع الأسهم على السواء
  function handleScroll() {
    const el = trackRef.current;
    if (!el || busy.current) return;
    const set = oneSetWidth();
    if (set === 0) return;

    if (el.scrollLeft < set * 0.5) {
      busy.current = true;
      el.scrollLeft += set;
      requestAnimationFrame(() => { busy.current = false; });
    } else if (el.scrollLeft > set * 1.5) {
      busy.current = true;
      el.scrollLeft -= set;
      requestAnimationFrame(() => { busy.current = false; });
    }
  }

  function scrollByCard(dir) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector(".row-scroll-item");
    const step = card ? card.getBoundingClientRect().width + 18 : 260;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <div className="row-scroll-wrap">
      {/* السهم اللي شكله لليمين = رجوع للخلف (نحو بداية القراءة العربية) */}
      <button className="row-nav row-nav-prev" onClick={() => scrollByCard(1)} aria-label="السابق">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <div className="row-scroll" ref={trackRef} onScroll={handleScroll}>
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
