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

function cartKey(id, variant = {}) {
  return `${id}|${variant.color || ""}|${variant.size || ""}`;
}

function normalizeCart(raw) {
  // لو الكارت محفوظ بالصيغة القديمة (id: qty) قبل دعم الألوان/المقاسات، نتجاهله بأمان
  const entries = Object.values(raw || {});
  const isOldFormat = entries.some((v) => typeof v === "number");
  if (isOldFormat) return {};
  return raw || {};
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
    setCart(normalizeCart(readLS("jv_cart", {})));
    Promise.all([refreshProducts(), refreshOrders()]).finally(() => setReady(true));
  }, [refreshProducts, refreshOrders]);

  useEffect(() => {
    if (ready) window.localStorage.setItem("jv_cart", JSON.stringify(cart));
  }, [cart, ready]);

  const addToCart = useCallback((id, qty = 1, variant = {}) => {
    const key = cartKey(id, variant);
    setCart((c) => {
      const existing = c[key];
      return {
        ...c,
        [key]: {
          id,
          color: variant.color || "",
          size: variant.size || "",
          qty: (existing?.qty || 0) + qty,
        },
      };
    });
  }, []);
  const changeQty = useCallback((key, delta) => {
    setCart((c) => {
      const existing = c[key];
      if (!existing) return c;
      const nextQty = existing.qty + delta;
      const next = { ...c };
      if (nextQty <= 0) {
        delete next[key];
      } else {
        next[key] = { ...existing, qty: nextQty };
      }
      return next;
    });
  }, []);
  const removeItem = useCallback((key) => {
    setCart((c) => {
      const next = { ...c };
      delete next[key];
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

  const updateProduct = useCallback(
    async (id, data) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) await refreshProducts();
      return res.ok;
    },
    [refreshProducts]
  );

  const togglePublish = useCallback(
    async (id, published) => {
      return updateProduct(id, { published });
    },
    [updateProduct]
  );

  const moveProduct = useCallback(
    async (id, direction) => {
      const idx = products.findIndex((p) => p.id === id);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (idx === -1 || swapIdx < 0 || swapIdx >= products.length) return false;

      const reordered = [...products];
      [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];

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

  // إعادة ترتيب كاملة (للسحب والإفلات) — بيستقبل قائمة المنتجات بترتيبها الجديد بالكامل
  const reorderProducts = useCallback(
    async (orderedIds) => {
      const byId = new Map(products.map((p) => [p.id, p]));
      const reordered = orderedIds.map((id) => byId.get(id)).filter(Boolean);
      if (reordered.length !== products.length) return false;

      // تحديث فوري في الواجهة (متفائل) قبل ما نستنى الرد من السيرفر
      setProducts(reordered);

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

  const cartCount = Object.values(cart).reduce((s, entry) => s + entry.qty, 0);
  const cartTotal = Object.values(cart).reduce((s, entry) => {
    const p = products.find((x) => x.id == entry.id);
    return p ? s + p.price * entry.qty : s;
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
        updateProduct,
        togglePublish,
        moveProduct,
        reorderProducts,
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
