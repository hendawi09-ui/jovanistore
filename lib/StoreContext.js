"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

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
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [orders, setOrders] = useState([]);
  const [ready, setReady] = useState(false);

  const refreshProducts = useCallback(async () => {
    const res = await fetch("/api/products");
    if (res.ok) setProducts(await res.json());
  }, []);
  const refreshOrders = useCallback(async () => {
    const res = await fetch("/api/orders");
    if (res.ok) setOrders(await res.json());
  }, []);

  useEffect(() => {
    setCart(readLS("jv_cart", {}));
    Promise.all([refreshProducts(), refreshOrders()]).finally(() => setReady(true));
  }, [refreshProducts, refreshOrders]);

  useEffect(() => {
    if (ready) window.localStorage.setItem("jv_cart", JSON.stringify(cart));
  }, [cart, ready]);

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

  const addProduct = useCallback(
    async (p) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      if (res.ok) await refreshProducts();
      return res.ok;
    },
    [refreshProducts]
  );
  const deleteProduct = useCallback(
    async (id) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) await refreshProducts();
      return res.ok;
    },
    [refreshProducts]
  );

  const moveProduct = useCallback(
    async (id, direction) => {
      const idx = products.findIndex((p) => p.id === id);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (idx === -1 || swapIdx < 0 || swapIdx >= products.length) return false;

      const reordered = [...products];
      [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];

      // نعيد ترقيم كل المنتجات بترتيبها الجديد لضمان تناسق sort_order
      const results = await Promise.all(
        reordered.map((p, i) =>
          fetch(`/api/products/${p.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sort_order: i }),
          })
        )
      );
      await refreshProducts();
      return results.every((r) => r.ok);
    },
    [products, refreshProducts]
  );

  const placeOrder = useCallback(
    async (details, items, total) => {
      const order = {
        id: "JV" + Date.now().toString().slice(-8),
        date: new Date().toLocaleDateString("ar-EG"),
        items,
        total,
        ...details,
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      if (res.ok) await refreshOrders();
      clearCart();
      return order;
    },
    [refreshOrders, clearCart]
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
        moveProduct,
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
