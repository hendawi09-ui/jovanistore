"use client";
import { useEffect, useState } from "react";
import BackgroundCanvas from "./BackgroundCanvas";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import Toast from "./Toast";
import FloatingActions from "./FloatingActions";

export default function ClientShell({ children }) {
  const [cartOpen, setCartOpen] = useState(false);

  // نمنع تمرير الصفحة اللي خلف السلة وقت فتحها، عشان ما يحصلش تعارض
  // مع ارتفاع الشاشة الفعلي على الموبايل (وده اللي كان بيمنع الوصول لزرار "إتمام الطلب")
  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen]);

  return (
    <>
      <BackgroundCanvas />
      <Header onOpenCart={() => setCartOpen(true)} />
      <main>{children}</main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <FloatingActions onOpenCart={() => setCartOpen(true)} />
      <Toast />
    </>
  );
}
