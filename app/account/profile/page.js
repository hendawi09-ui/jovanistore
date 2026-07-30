"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/StoreContext";
import { showToast } from "@/components/Toast";
import { governorates } from "@/lib/siteConfig";

export default function AccountProfilePage() {
  const { account, updateAccountProfile } = useStore();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (account) {
      setForm({
        name: account.name || "",
        phone: account.phone || "",
        city: account.city || "",
        address: account.address || "",
      });
    }
  }, [account]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    const { ok, error } = await updateAccountProfile(form);
    setBusy(false);
    if (!ok) {
      showToast(error || "حصل خطأ");
      return;
    }
    showToast("تم حفظ بياناتك ✓");
    router.push("/orders");
  }

  if (!account) {
    return (
      <div className="orders-wrap">
        <div className="empty-state">
          لازم تسجّل دخول الأول.<br /><br />
          <Link href="/orders" className="btn-primary">تسجيل الدخول</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-wrap">
      <div className="section-head" style={{ margin: "0 0 24px", padding: 0 }}><h2>بياناتي</h2></div>
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>الاسم الكامل</label>
            <input required name="name" value={form.name} onChange={handleChange} placeholder="مثال: سارة أحمد" />
          </div>
          <div className="field">
            <label>رقم الموبايل</label>
            <input required type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="01xxxxxxxxx" />
          </div>
          <div className="field">
            <label>المحافظة</label>
            <select required className="admin-select" name="city" value={form.city} onChange={handleChange}>
              <option value="">اختر محافظتك</option>
              {governorates.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>العنوان التفصيلي</label>
            <textarea required rows={3} name="address" value={form.address} onChange={handleChange} placeholder="الحي، الشارع، رقم المبنى" />
          </div>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "جارِ الحفظ..." : "حفظ البيانات"}
          </button>
        </form>
      </div>
    </div>
  );
}
