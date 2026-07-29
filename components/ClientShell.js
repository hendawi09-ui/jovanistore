"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BackgroundCanvas from "./BackgroundCanvas";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import FavoritesDrawer from "./FavoritesDrawer";
import Toast from "./Toast";
import FloatingActions from "./FloatingActions";

export default function ClientShell({ children }) {
  const router = useRouter();
  const [panel, setPanel] = useState(null); // null | "cart" | "favorites"
  const scrollY = useRef(0);
  const pushedState = useRef(false);

  const anyOpen = panel !== null;

  // فتح أي درج: بنضيف خطوة في تاريخ المتصفح عشان زرار الرجوع يقفله
  // بدل ما يخرج المستخدم من الصفحة
  const openPanel = useCallback((name) => {
    setPanel((current) => {
      if (current === null) {
        window.history.pushState({ panel: name }, "");
        pushedState.current = true;
      }
      return name;
    });
  }, []);

  const openCart = useCallback(() => openPanel("cart"), [openPanel]);
  const openFavorites = useCallback(() => openPanel("favorites"), [openPanel]);

  // القفل من زرار الإغلاق أو الخلفية
  const closePanel = useCallback(() => {
    if (pushedState.current) {
      pushedState.current = false;
      window.history.back(); // هيشغّل popstate اللي بيقفل الدرج
    } else {
      setPanel(null);
    }
  }, []);

  // الانتقال لصفحة الدفع: بنستبدل خطوة الدرج في التاريخ بدل ما نرجع ونتقدم
  const goToCheckout = useCallback(() => {
    if (pushedState.current) {
      pushedState.current = false;
      window.history.replaceState({}, "");
    }
    setPanel(null);
    router.push("/checkout");
  }, [router]);

  // زرار الرجوع في الموبايل بيقفل الدرج المفتوح
  useEffect(() => {
    function onPopState() {
      pushedState.current = false;
      setPanel(null);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // قفل تمرير الصفحة اللي ورا الدرج.
  // بنستخدم position:fixed لأن overflow:hidden لوحده مش بيمنع التمرير على متصفحات الموبايل،
  // وبنحفظ مكان التمرير ونرجّعه بعد القفل عشان الصفحة ما تنطّش لفوق.
  useEffect(() => {
    const body = document.body;
    if (anyOpen) {
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
  }, [anyOpen]);

  // تنظيف احتياطي لو الصفحة اتقفلت والدرج مفتوح
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
      <Header onOpenCart={openCart} onOpenFavorites={openFavorites} />
      <main>{children}</main>
      <Footer />
      <CartDrawer open={panel === "cart"} onClose={closePanel} onCheckout={goToCheckout} />
      <FavoritesDrawer open={panel === "favorites"} onClose={closePanel} />
      <FloatingActions onOpenCart={openCart} onOpenFavorites={openFavorites} />
      <Toast />
    </>
  );
}
