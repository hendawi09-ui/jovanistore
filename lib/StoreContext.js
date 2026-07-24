"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { defaultProducts } from "./products";

const StoreContext = createContext(null);

function readLS(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(defaultProducts);
  const [cart, setCart] = useState({});
  const [orders, setOrders] = useState([]);
  const [ready, setReady] = useState(false);

  // load persisted state on mount (client only)
  useEffect(() => {
    setProducts(readLS("jv_products", defaultProducts));
    setCart(readLS("jv_cart", {}));
    setOrders(readLS("jv_orders", []));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem("jv_products", JSON.stringify(products));
  }, [products, ready]);
  useEffect(() => {
    if (ready) window.localStorage.setItem("jv_cart", JSON.stringify(cart));
  }, [cart, ready]);
  useEffect(() => {
    if (ready) window.localStorage.setItem("jv_orders", JSON.stringify(orders));
  }, [orders, ready]);

  const addToCart = useCallback((id, qty = 1) => {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + qty }));
  }, []);
  const changeQty = useCallback((id, delta) => {
    setCart((c) => {
      const next = { ...c, [id]: (c[id] || 0) + delta };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  }, []);
  const removeItem = useCallback((id) => {
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  }, []);
  const clearCart = useCallback(() => setCart({}), []);

  const addProduct = useCallback((p) => {
    setProducts((list) => [...list, { ...p, id: Date.now() }]);
  }, []);
  const deleteProduct = useCallback((id) => {
    setProducts((list) => list.filter((p) => p.id !== id));
  }, []);

  const placeOrder = useCallback(
    (details, items, total) => {
      const order = {
        id: "JV" + Date.now().toString().slice(-8),
        date: new Date().toLocaleDateString("ar-EG"),
        items,
        total,
        ...details,
      };
      setOrders((list) => [order, ...list]);
      clearCart();
      return order;
    },
    [clearCart]
  );

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartTotal = Object.keys(cart).reduce((s, id) => {
    const p = products.find((x) => x.id == id);
    return p ? s + p.price * cart[id] : s;
  }, 0);

  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        orders,
        cartCount,
        cartTotal,
        addToCart,
        changeQty,
        removeItem,
        clearCart,
        addProduct,
        deleteProduct,
        placeOrder,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
