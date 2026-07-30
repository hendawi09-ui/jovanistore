"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { effectivePrice } from "./products";

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

function readSS(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
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
  const [favorites, setFavorites] = useState({}); // المفضلة — بنفس مفتاح السلة (منتج + لون + مقاس)
  const [buyNow, setBuyNow] = useState(null); // منتج "اشترِ الآن" — منفصل تمامًا عن السلة
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState(null); // حساب العميل: { phone, name, city, address } أو null

  const refreshProducts = useCallback(async () => {
    const res = await fetch("/api/products");
    if (res.ok) setProducts(await res.json());
  }, []);
  // بنجيب طلبات العميل الحالي فقط
  // لو عنده حساب مسجّل (رقم موبايل)، بنجيبها بالرقم عشان تظهر من أي جهاز
  // وإلا بالطريقة القديمة: أرقام الطلبات المحفوظة في متصفحه بس
  const refreshOrders = useCallback(async () => {
    const acc = readLS("jv_account", null);
    const phone = acc?.phone || null;
    if (phone) {
      const res = await fetch("/api/orders/by-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) setOrders(await res.json());
      return;
    }
    const ids = readLS("jv_my_orders", []);
    if (!Array.isArray(ids) || ids.length === 0) {
      setOrders([]);
      return;
    }
    const res = await fetch("/api/orders/mine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) setOrders(await res.json());
  }, []);

  useEffect(() => {
    setCart(normalizeCart(readLS("jv_cart", {})));
    setFavorites(readLS("jv_favorites", {}) || {});
    setBuyNow(readSS("jv_buynow", null));
    setAccount(readLS("jv_account", null));
    Promise.all([refreshProducts(), refreshOrders()]).finally(() => setReady(true));
  }, [refreshProducts, refreshOrders]);

  useEffect(() => {
    if (ready) window.localStorage.setItem("jv_cart", JSON.stringify(cart));
  }, [cart, ready]);

  useEffect(() => {
    if (ready) window.localStorage.setItem("jv_favorites", JSON.stringify(favorites));
  }, [favorites, ready]);

  useEffect(() => {
    if (!ready) return;
    if (buyNow) window.sessionStorage.setItem("jv_buynow", JSON.stringify(buyNow));
    else window.sessionStorage.removeItem("jv_buynow");
  }, [buyNow, ready]);

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

  // ---- المفضلة ----
  const isFavorite = useCallback(
    (id, variant = {}) => Boolean(favorites[cartKey(id, variant)]),
    [favorites]
  );

  const addToFavorites = useCallback((id, variant = {}) => {
    const key = cartKey(id, variant);
    setFavorites((f) => ({
      ...f,
      [key]: { id, color: variant.color || "", size: variant.size || "" },
    }));
  }, []);

  const removeFavorite = useCallback((key) => {
    setFavorites((f) => {
      const next = { ...f };
      delete next[key];
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((id, variant = {}) => {
    const key = cartKey(id, variant);
    setFavorites((f) => {
      const next = { ...f };
      if (next[key]) delete next[key];
      else next[key] = { id, color: variant.color || "", size: variant.size || "" };
      return next;
    });
  }, []);

  // نقل منتج من السلة إلى المفضلة (بيتشال من السلة)
  const moveToFavorites = useCallback((key) => {
    setCart((c) => {
      const entry = c[key];
      if (!entry) return c;
      setFavorites((f) => ({
        ...f,
        [key]: { id: entry.id, color: entry.color || "", size: entry.size || "" },
      }));
      const next = { ...c };
      delete next[key];
      return next;
    });
  }, []);

  // نقل منتج من المفضلة إلى السلة (بيتشال من المفضلة)
  const moveToCart = useCallback((key) => {
    setFavorites((f) => {
      const entry = f[key];
      if (!entry) return f;
      setCart((c) => {
        const existing = c[key];
        return {
          ...c,
          [key]: {
            id: entry.id,
            color: entry.color || "",
            size: entry.size || "",
            qty: (existing?.qty || 0) + 1,
          },
        };
      });
      const next = { ...f };
      delete next[key];
      return next;
    });
  }, []);

  const startBuyNow = useCallback((id, qty = 1, variant = {}) => {
    setBuyNow({ id, qty, color: variant.color || "", size: variant.size || "" });
  }, []);
  const clearBuyNow = useCallback(() => setBuyNow(null), []);

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
    async (details, items, total, source = "cart") => {
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
      if (res.ok) {
        // نحفظ رقم الطلب في متصفح العميل عشان يقدر يتابعه لاحقًا
        try {
          const prev = readLS("jv_my_orders", []);
          const ids = Array.isArray(prev) ? prev : [];
          window.localStorage.setItem("jv_my_orders", JSON.stringify([order.id, ...ids].slice(0, 100)));
        } catch {}
        await refreshOrders();
      }
      if (source === "buynow") clearBuyNow();
      else clearCart();
      return order;
    },
    [refreshOrders, clearCart, clearBuyNow]
  );

  // إلغاء الطلب من العميل (للطلبات اللي لسه قيد الانتظار بس)
  const cancelOrder = useCallback(
    async (id, phone) => {
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) await refreshOrders();
      return { ok: res.ok, error: data.error };
    },
    [refreshOrders]
  );

  const updateOrderStatus = useCallback(
    async (id, status) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await refreshOrders();
      return res.ok;
    },
    [refreshOrders]
  );

  // إنشاء حساب جديد برقم موبايل وكلمة سر
  const registerAccount = useCallback(
    async (rawPhone, password) => {
      const phone = String(rawPhone || "").replace(/\D/g, "");
      if (!phone || phone.length < 8) return { ok: false, error: "رقم الموبايل غير صحيح" };
      if (!password || password.length < 4) {
        return { ok: false, error: "كلمة السر لازم تكون 4 حروف أو أرقام على الأقل" };
      }

      const res = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || "حصل خطأ" };

      window.localStorage.setItem("jv_account", JSON.stringify(data));
      setAccount(data);
      await refreshOrders();
      return { ok: true };
    },
    [refreshOrders]
  );

  // تسجيل دخول لحساب موجود
  const loginAccount = useCallback(
    async (rawPhone, password) => {
      const phone = String(rawPhone || "").replace(/\D/g, "");
      if (!phone || !password) return { ok: false, error: "من فضلك اكتب رقم الموبايل وكلمة السر" };

      const res = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || "حصل خطأ" };

      window.localStorage.setItem("jv_account", JSON.stringify(data));
      setAccount(data);
      await refreshOrders();
      return { ok: true };
    },
    [refreshOrders]
  );

  // تحديث بيانات الحساب (الاسم، المحافظة، العنوان، ورقم الموبايل لو مش موجود)
  const updateAccountProfile = useCallback(async (fields) => {
    const acc = readLS("jv_account", null);
    if (!acc || (!acc.phone && !acc.email)) return { ok: false, error: "لازم تسجّل دخول الأول" };

    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPhone: acc.phone || "", currentEmail: acc.email || "", ...fields }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || "حصل خطأ" };

    window.localStorage.setItem("jv_account", JSON.stringify(data));
    setAccount(data);
    await refreshOrders();
    return { ok: true };
  }, [refreshOrders]);

  // تفعيل جلسة الدخول بعد رجوع العميل من جوجل/فيسبوك
  const applyOAuthSession = useCallback(
    async (profile) => {
      window.localStorage.setItem("jv_account", JSON.stringify(profile));
      setAccount(profile);
      await refreshOrders();
    },
    [refreshOrders]
  );

  const logoutAccount = useCallback(() => {
    window.localStorage.removeItem("jv_account");
    setAccount(null);
    setOrders([]);
  }, []);

  const cartCount = Object.values(cart).reduce((s, entry) => s + entry.qty, 0);
  const favCount = Object.keys(favorites).length;
  const cartTotal = Object.values(cart).reduce((s, entry) => {
    const p = products.find((x) => x.id == entry.id);
    return p ? s + effectivePrice(p) * entry.qty : s;
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
        favorites,
        favCount,
        isFavorite,
        addToFavorites,
        removeFavorite,
        toggleFavorite,
        moveToFavorites,
        moveToCart,
        buyNow,
        startBuyNow,
        clearBuyNow,
        addProduct,
        deleteProduct,
        updateProduct,
        togglePublish,
        moveProduct,
        reorderProducts,
        placeOrder,
        updateOrderStatus,
        cancelOrder,
        account,
        registerAccount,
        loginAccount,
        updateAccountProfile,
        applyOAuthSession,
        logoutAccount,
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
