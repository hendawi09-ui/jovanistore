"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/StoreContext";
import { showToast } from "@/components/Toast";

export default function CheckoutPage() {
  const { cart, products, cartTotal, placeOrder, buyNow, clearBuyNow } = useStore();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "", pay: "cod" });

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null); // { code, discount, label }
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  // لو المستخدم جاي من "اشترِ الآن"، بنعرض المنتج ده لوحده ومنمسّش السلة خالص
  const isBuyNow = Boolean(buyNow && products.some((p) => p.id == buyNow.id));

  const entries = isBuyNow
    ? [["buynow", buyNow]]
    : Object.entries(cart).filter(([, e]) => products.some((p) => p.id == e.id));

  const subtotal = isBuyNow
    ? (products.find((p) => p.id == buyNow.id)?.price || 0) * buyNow.qty
    : cartTotal;

  const itemCount = entries.reduce((s, [, e]) => s + e.qty, 0);
  const discount = coupon ? coupon.discount : 0;
  const total = Math.max(0, subtotal - discount);

  if (entries.length === 0) {
    return (
      <div className="empty-state">
        سلتك فارغة، أضف بعض المنتجات أولًا.<br /><br />
        <Link href="/" className="btn-primary">تصفّح المنتجات</Link>
      </div>
    );
  }

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCheckingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal, itemCount }),
      });
      const data = await res.json();
      if (data.ok) {
        setCoupon({ code: data.code, discount: data.discount, label: data.label });
        showToast(`تم تطبيق الخصم ✓ وفّرت ${data.discount} ج.م`);
      } else {
        setCoupon(null);
        setCouponError(data.error || "كود غير صحيح");
      }
    } catch {
      setCouponError("تعذّر التحقق من الكود، حاول مرة أخرى");
    }
    setCheckingCoupon(false);
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const items = entries.map(([, entry]) => {
      const p = products.find((x) => x.id == entry.id);
      const variantLabel = [entry.color, entry.size].filter(Boolean).join(" · ");
      return {
        productId: p.id,
        name: variantLabel ? `${p.name} (${variantLabel})` : p.name,
        qty: entry.qty,
        price: p.price,
        color: entry.color || null,
        size: entry.size || null,
      };
    });

    const extra = {
      subtotal,
      discount,
      coupon_code: coupon ? coupon.code : null,
    };

    await placeOrder({ ...form, ...extra }, items, total, isBuyNow ? "buynow" : "cart");
    showToast("تم تأكيد طلبك بنجاح 🎉");
    router.push("/orders");
  }

  return (
    <div className="checkout-wrap">
      <div className="form-card">
        <h2>بيانات الشحن</h2>
        <form onSubmit={handleSubmit}>
          <div className="field"><label>الاسم الكامل</label><input required name="name" value={form.name} onChange={handleChange} placeholder="مثال: سارة أحمد" /></div>
          <div className="field"><label>رقم الموبايل</label><input required name="phone" value={form.phone} onChange={handleChange} placeholder="01xxxxxxxxx" /></div>
          <div className="field"><label>المحافظة / المدينة</label><input required name="city" value={form.city} onChange={handleChange} placeholder="مثال: القاهرة" /></div>
          <div className="field"><label>العنوان التفصيلي</label><textarea required rows={3} name="address" value={form.address} onChange={handleChange} placeholder="الحي، الشارع، رقم المبنى" /></div>
          <div className="field">
            <label>طريقة الدفع</label>
            <div className="pay-options">
              <label className="pay-opt"><input type="radio" name="pay" value="cod" checked={form.pay === "cod"} onChange={handleChange} /> الدفع عند الاستلام</label>
              <label className="pay-opt"><input type="radio" name="pay" value="card" checked={form.pay === "card"} onChange={handleChange} /> بطاقة ائتمان (تجريبي)</label>
            </div>
          </div>
          <button type="submit" className="submit-btn">تأكيد الطلب</button>
          <div className="note-box">هذا نموذج تجريبي — لا يتم خصم أي مبلغ فعلي حتى يتم ربط بوابة دفع حقيقية.</div>
        </form>
      </div>
      <div className="summary-card">
        <h2>ملخص الطلب</h2>
        {isBuyNow && (
          <div className="buynow-note">
            شراء مباشر لهذا المنتج فقط — سلتك محفوظة كما هي.
            <button type="button" onClick={() => { clearBuyNow(); router.push("/checkout"); }}>
              العودة لطلب السلة
            </button>
          </div>
        )}
        {entries.map(([key, entry]) => {
          const p = products.find((x) => x.id == entry.id);
          const variantLabel = [entry.color, entry.size].filter(Boolean).join(" · ");
          return (
            <div className="summary-row" key={key}>
              <span>{p.name}{variantLabel ? ` (${variantLabel})` : ""} × {entry.qty}</span>
              <span>{p.price * entry.qty} ج.م</span>
            </div>
          );
        })}

        <div className="coupon-box">
          {coupon ? (
            <div className="coupon-applied">
              <span>كود <strong>{coupon.code}</strong> ({coupon.label}) مُطبّق</span>
              <button type="button" onClick={removeCoupon}>إزالة</button>
            </div>
          ) : (
            <>
              <div className="coupon-row">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="عندك كود خصم؟"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
                />
                <button type="button" onClick={applyCoupon} disabled={checkingCoupon}>
                  {checkingCoupon ? "..." : "تطبيق"}
                </button>
              </div>
              {couponError && <div className="coupon-error">{couponError}</div>}
            </>
          )}
        </div>

        <div className="summary-row"><span>المجموع الفرعي</span><span>{subtotal} ج.م</span></div>
        {discount > 0 && (
          <div className="summary-row discount-row"><span>الخصم</span><span>− {discount} ج.م</span></div>
        )}
        <div className="summary-row"><span>الشحن</span><span>مجاني</span></div>
        <div className="summary-total"><span>الإجمالي</span><span>{total} ج.م</span></div>
      </div>
    </div>
  );
}
