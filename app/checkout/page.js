"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/StoreContext";
import { showToast } from "@/components/Toast";

export default function CheckoutPage() {
  const { cart, products, cartTotal, placeOrder } = useStore();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "", pay: "cod" });

  const ids = Object.keys(cart).filter((id) => products.some((p) => p.id == id));

  if (ids.length === 0) {
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

  async function handleSubmit(e) {
    e.preventDefault();
    const items = ids.map((id) => {
      const p = products.find((x) => x.id == id);
      return { name: p.name, qty: cart[id], price: p.price };
    });
    await placeOrder(form, items, cartTotal);
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
        {ids.map((id) => {
          const p = products.find((x) => x.id == id);
          return (
            <div className="summary-row" key={id}>
              <span>{p.name} × {cart[id]}</span>
              <span>{p.price * cart[id]} ج.م</span>
            </div>
          );
        })}
        <div className="summary-row"><span>الشحن</span><span>مجاني</span></div>
        <div className="summary-total"><span>الإجمالي</span><span>{cartTotal} ج.م</span></div>
      </div>
    </div>
  );
}
