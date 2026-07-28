export const cats = [
  { id: "all", label: "الكل", color: null },
  { id: "men", label: "رجالي", color: "var(--ink)" },
  { id: "women", label: "نسائي", color: "var(--red)" },
];

export const catCssVar = { men: "--ink", women: "--red" };
export const catLabel = { men: "رجالي", women: "نسائي" };

export const defaultProducts = [
  { id: 1, cat: "men", icon: "shirt", name: "قميص كتان كلاسيك", desc: "قصة مريحة، قطن مصري 100%، مناسب للإطلالات اليومية والرسمية الخفيفة.", price: 189 },
  { id: 2, cat: "men", icon: "jacket", name: "جاكيت جينز أزرق", desc: "خامة دنيم متينة بتصميم كلاسيكي يدوم لسنوات مع كل غسلة.", price: 295 },
  { id: 3, cat: "men", icon: "pants", name: "بنطلون قماش رمادي", desc: "قصة ضيقة عصرية، قماش مرن يمنحك حرية حركة كاملة.", price: 210 },
  { id: 4, cat: "women", icon: "dress", name: "فستان صيفي مزهّر", desc: "شيفون خفيف بتهوية ممتازة، مثالي لأيام الصيف الحارة.", price: 249 },
  { id: 5, cat: "women", icon: "shirt", name: "بلوزة حرير وردية", desc: "لمسة ناعمة وأنيقة، مناسبة للعمل والمناسبات الخفيفة.", price: 175 },
  { id: 6, cat: "women", icon: "dress", name: "تنورة بليه صفراء", desc: "طول متوسط بخصر مطاطي مريح يناسب مختلف المقاسات.", price: 159 },
  { id: 12, cat: "women", icon: "shirt", name: "بلوزة أكمام واسعة", desc: "قماش قطن مطاط بقصة عصرية سهلة التنسيق.", price: 165 },
];

// ---- تحليل خيارات اللون والمقاس ----
// اللون بيتكتب في لوحة التحكم بأي صيغة من دول:
//   "أحمر"                       -> بدون عيّنة لون
//   "أحمر:#E31B23"               -> عيّنة لون
//   "أحمر:https://.../img.jpg"   -> عيّنة صورة
export function parseColor(raw) {
  const str = String(raw).trim();
  const idx = str.indexOf(":");
  if (idx === -1) return { name: str, swatch: null, type: null };

  const name = str.slice(0, idx).trim();
  const value = str.slice(idx + 1).trim();
  if (!name || !value) return { name: str, swatch: null, type: null };

  if (value.startsWith("http")) return { name, swatch: value, type: "image" };
  return { name, swatch: value, type: "color" };
}

// المقاس بيتكتب: "M" (متاح) أو "M:out" (غير متاح / نفدت الكمية)
export function parseSize(raw) {
  const str = String(raw).trim();
  const idx = str.lastIndexOf(":");
  if (idx === -1) return { name: str, available: true };

  const name = str.slice(0, idx).trim();
  const flag = str.slice(idx + 1).trim().toLowerCase();
  if (name && (flag === "out" || flag === "نفد")) return { name, available: false };
  return { name: str, available: true };
}

// ---- إدارة المخزون لكل تركيبة (لون + مقاس) ----
// المخزون بيتخزّن كـ { "أحمر|M": 5, "أحمر|L": 2, ... }
// المنتج اللي مالوش ألوان/مقاسات بيستخدم المفتاح "|"
export function stockKey(color = "", size = "") {
  return `${color || ""}|${size || ""}`;
}

// بيرجع الكمية المتاحة لتركيبة معيّنة. لو المخزون مش متسجّل أصلًا، بنعتبر المنتج متاح (بدون تتبّع).
export function getStock(product, color = "", size = "") {
  const stock = product?.stock;
  if (!stock || typeof stock !== "object") return null; // null = المخزون غير مُفعّل لهذا المنتج
  const val = stock[stockKey(color, size)];
  return typeof val === "number" ? val : 0;
}

// إجمالي الكمية المتاحة للمنتج كله
export function getTotalStock(product) {
  const stock = product?.stock;
  if (!stock || typeof stock !== "object") return null;
  return Object.values(stock).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
}

// ---- خصم المنتج ----
// لو المنتج عليه سعر بعد الخصم (salePrice) أقل من السعر الأصلي، بنستخدمه كسعر فعلي
export function hasDiscount(p) {
  return typeof p?.salePrice === "number" && p.salePrice > 0 && p.salePrice < p.price;
}

export function effectivePrice(p) {
  return hasDiscount(p) ? p.salePrice : p?.price || 0;
}

export function discountPercent(p) {
  if (!hasDiscount(p)) return 0;
  return Math.round(((p.price - p.salePrice) / p.price) * 100);
}
