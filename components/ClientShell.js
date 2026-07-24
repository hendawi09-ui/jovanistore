"use client";
import { useState } from "react";
import BackgroundCanvas from "./BackgroundCanvas";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import Toast from "./Toast";

export default function ClientShell({ children }) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <BackgroundCanvas />
      <Header onOpenCart={() => setCartOpen(true)} />
      <main>{children}</main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <Toast />
    </>
  );
}
