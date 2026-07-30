"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/StoreContext";
import { showToast } from "@/components/Toast";
import { governorates } from "@/lib/siteConfig";

// أيقونة العين لكشف/إخفاء كلمة السر
function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.1 10.1 0 0 1 12 20c-7 0-11-8-11-8a18.4 18.4 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function AccountProfilePage() {
  const { account, updateAccountProfile, changeAccountPassword } = useStore();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", address: "" });
  const [busy, setBusy] = useState(false);

  // تغيير كلمة السر
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [pwdBusy, setPwdBusy] = useState(false);
  const [confirmingPwd, setConfirmingPwd] = useState(false); // رسالة التأكيد قبل التغيير

  useEffect(() => {
    if (account) {
      setForm({
        name: account.name || "",
        phone: account.phone || "",
        email: account.email || "",
        city: account.city || "",
        address: account.address || "",
      });
    }
  }, [account]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handlePwdChange(e) {
    setPwd((p) => ({ ...p, [e.target.name]: e.target.value }));
    setConfirmingPwd(false); // أي تعديل يلغي التأكيد المعلّق
  }

  function togglePwd(field) {
    setShowPwd((s) => ({ ...s, [field]: !s[field] }));
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

  // أول ضغطة بتعرض رسالة التأكيد، والتانية بتنفّذ التغيير فعلًا
  function handlePwdSubmit(e) {
    e.preventDefault();
    if (pwd.next.length < 4) {
      showToast("كلمة السر الجديدة لازم تكون 4 حروف أو أرقام على الأقل");
      return;
    }
    if (pwd.next !== pwd.confirm) {
      showToast("تأكيد كلمة السر مش مطابق");
      return;
    }
    setConfirmingPwd(true);
  }

  async function doChangePassword() {
    setPwdBusy(true);
    const { ok, error } = await changeAccountPassword(pwd.current, pwd.next);
    setPwdBusy(false);
    setConfirmingPwd(false);
    if (!ok) {
      showToast(error || "حصل خطأ");
      return;
    }
    setPwd({ current: "", next: "", confirm: "" });
    showToast("تم تغيير كلمة السر ✓");
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
            <label>الإيميل <span className="field-note">(اختياري — بس لازم عشان تقدر تسترجع كلمة السر لو نسيتها)</span></label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="example@gmail.com" />
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

      <div className="section-head" style={{ margin: "34px 0 16px", padding: 0 }}><h2>تغيير كلمة السر</h2></div>

      <div className="form-card">
        <form onSubmit={handlePwdSubmit}>
          <div className="field">
            <label>كلمة السر الحالية</label>
            <div className="password-field">
              <input
                type={showPwd.current ? "text" : "password"}
                name="current"
                value={pwd.current}
                onChange={handlePwdChange}
                placeholder="اكتب كلمة السر الحالية"
              />
              <button type="button" className="password-toggle" onClick={() => togglePwd("current")} aria-label="إظهار كلمة السر">
                <EyeIcon open={showPwd.current} />
              </button>
            </div>
          </div>

          <div className="field">
            <label>كلمة السر الجديدة</label>
            <div className="password-field">
              <input
                type={showPwd.next ? "text" : "password"}
                name="next"
                value={pwd.next}
                onChange={handlePwdChange}
                placeholder="4 حروف أو أرقام على الأقل"
              />
              <button type="button" className="password-toggle" onClick={() => togglePwd("next")} aria-label="إظهار كلمة السر">
                <EyeIcon open={showPwd.next} />
              </button>
            </div>
          </div>

          <div className="field">
            <label>تأكيد كلمة السر الجديدة</label>
            <div className="password-field">
              <input
                type={showPwd.confirm ? "text" : "password"}
                name="confirm"
                value={pwd.confirm}
                onChange={handlePwdChange}
                placeholder="اكتبها تاني للتأكيد"
              />
              <button type="button" className="password-toggle" onClick={() => togglePwd("confirm")} aria-label="إظهار كلمة السر">
                <EyeIcon open={showPwd.confirm} />
              </button>
            </div>
          </div>

          {!confirmingPwd ? (
            <button type="submit" className="btn-primary" disabled={pwdBusy}>
              تغيير كلمة السر
            </button>
          ) : (
            <div className="pwd-confirm">
              <span>متأكد إنك عايز تغيّر كلمة السر؟ هتحتاج تستخدم الجديدة في كل دخول بعد كده.</span>
              <div className="pwd-confirm-actions">
                <button type="button" className="pwd-yes" disabled={pwdBusy} onClick={doChangePassword}>
                  {pwdBusy ? "جارِ التغيير..." : "نعم، غيّرها"}
                </button>
                <button type="button" className="pwd-no" disabled={pwdBusy} onClick={() => setConfirmingPwd(false)}>
                  تراجع
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
