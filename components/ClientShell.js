"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BackgroundCanvas from "./BackgroundCanvas";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import Toast from "./Toast";
import FloatingActions from "./FloatingActions";

export default function ClientShell({ children }) {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const scrollY = useRef(0);
  const pushedState = useRef(false);

  // فتح السلة: بنضيف خطوة في تاريخ المتصفح عشان زرار الرجوع يقفل السلة
  // بدل ما يخرج المستخدم من الصفحة
  const openCart = useCallback(() => {
    if (!cartOpen) {
      window.history.pushState({ cart: true }, "");
      pushedState.current = true;
      setCartOpen(true);
    }
  }, [cartOpen]);

  // قفل السلة من زرار الإغلاق أو الخلفية: بنرجع خطوة في التاريخ لو إحنا اللي ضفناها
  const closeCart = useCallback(() => {
    if (pushedState.current) {
      pushedState.current = false;
      window.history.back(); // هيشغّل popstate اللي بيقفل السلة
    } else {
      setCartOpen(false);
    }
  }, []);

  // الانتقال لصفحة الدفع: بنستبدل خطوة السلة في التاريخ بدل ما نرجع ونتقدم
  // عشان زرار الرجوع من صفحة الدفع يرجّع المستخدم للصفحة اللي كان فيها
  const goToCheckout = useCallback(() => {
    if (pushedState.current) {
      pushedState.current = false;
      window.history.replaceState({}, "");
    }
    setCartOpen(false);
    router.push("/checkout");
  }, [router]);

  // زرار الرجوع في الموبايل بيقفل السلة
  useEffect(() => {
    function onPopState() {
      pushedState.current = false;
      setCartOpen(false);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // قفل تمرير الصفحة اللي ورا السلة.
  // بنستخدم position:fixed لأن overflow:hidden لوحده مش بيمنع التمرير على متصفحات الموبايل،
  // وبنحفظ مكان التمرير ونرجّعه بعد القفل عشان الصفحة ما تنطّش لفوق.
  useEffect(() => {
    const body = document.body;
    if (cartOpen) {
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
  }, [cartOpen]);

  // تنظيف احتياطي لو الصفحة اتقفلت والسلة مفتوحة
  useEffect(() => {
    return () => {
      const body = document.body;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
    };
  }, []);

  return (
    <>
      <BackgroundCanvas />
      <Header onOpenCart={openCart} />
      <main>{children}</main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={closeCart} onCheckout={goToCheckout} />
      <FloatingActions onOpenCart={openCart} />
      <Toast />
    </>
  );
}
