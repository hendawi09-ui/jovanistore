// منطق التحقق من الكوبون وحساب الخصم — مستخدم في السيرفر (التحقق وإنشاء الطلب)

export function validateCoupon(coupon, { subtotal = 0, itemCount = 0 } = {}) {
  if (!coupon) return { ok: false, error: "كود الخصم غير صحيح" };
  if (coupon.active === false) return { ok: false, error: "هذا الكود غير مفعّل حاليًا" };

  if (coupon.expires_at) {
    // نقارن بالتاريخ فقط (بدون وقت) عشان الكوبون يفضل صالح طول يوم انتهائه
    const today = new Date().toISOString().slice(0, 10);
    if (coupon.expires_at < today) return { ok: false, error: "انتهت صلاحية هذا الكود" };
  }

  if (typeof coupon.max_uses === "number" && coupon.max_uses > 0) {
    if ((coupon.uses || 0) >= coupon.max_uses) {
      return { ok: false, error: "تم استهلاك هذا الكود بالكامل" };
    }
  }

  if (coupon.min_total && subtotal < Number(coupon.min_total)) {
    return { ok: false, error: `هذا الكود يتطلب طلبًا بقيمة ${coupon.min_total} ج.م على الأقل` };
  }

  if (coupon.min_items && itemCount < Number(coupon.min_items)) {
    return { ok: false, error: `هذا الكود يتطلب ${coupon.min_items} قطع على الأقل` };
  }

  const discount = calcDiscount(coupon, subtotal);
  if (discount <= 0) return { ok: false, error: "لا ينطبق هذا الكود على طلبك" };

  return { ok: true, discount };
}

export function calcDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  const value = Number(coupon.value) || 0;
  const raw = coupon.type === "fixed" ? value : (subtotal * value) / 100;
  // الخصم لا يتجاوز قيمة الطلب أبدًا
  return Math.min(Math.round(raw), subtotal);
}

export function couponLabel(coupon) {
  if (!coupon) return "";
  return coupon.type === "fixed" ? `${coupon.value} ج.م` : `${coupon.value}%`;
}
