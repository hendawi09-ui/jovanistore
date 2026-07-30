"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { showToast } from "@/components/Toast";

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

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [pwd, setPwd] = useState({ next: "", confirm: "" });
  const [showPwd, setShowPwd] = useState({ next: false, confirm: false });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (pwd.next.length < 4) {
      showToast("كلمة السر لازم تكون 4 حروف أو أرقام على الأقل");
      return;
    }
    if (pwd.next !== pwd.confirm) {
      showToast("تأكيد كلمة السر مش مطابق");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/account/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: pwd.next }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      showToast(data.error || "حصل خطأ");
      return;
    }
    setDone(true);
    showToast("تم تغيير كلمة السر ✓");
  }

  if (!token) {
    return (
      <div className="orders-wrap">
        <div className="empty-state">
          الرابط غير صالح.<br /><br />
          <Link href="/orders" className="btn-primary">ارجع لصفحة الدخول</Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="orders-wrap">
        <div className="section-head" style={{ margin: "0 0 24px", padding: 0 }}><h2>تم بنجاح</h2></div>
        <div className="account-login-box">
          <p className="account-login-hint">
            تم تغيير كلمة السر ✓ تقدر تسجّل دخول بيها دلوقتي.
          </p>
          <button className="btn-primary" onClick={() => router.push("/orders")}>
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-wrap">
      <div className="section-head" style={{ margin: "0 0 24px", padding: 0 }}><h2>كلمة سر جديدة</h2></div>
      <div className="account-login-box">
        <p className="account-login-hint">اختار كلمة سر جديدة لحسابك.</p>
        <form onSubmit={handleSubmit} className="account-login-form">
          <div className="password-field">
            <input
              type={showPwd.next ? "text" : "password"}
              required
              placeholder="كلمة السر الجديدة"
              value={pwd.next}
              onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPwd((s) => ({ ...s, next: !s.next }))} aria-label="إظهار كلمة السر">
              <EyeIcon open={showPwd.next} />
            </button>
          </div>

          <div className="password-field">
            <input
              type={showPwd.confirm ? "text" : "password"}
              required
              placeholder="تأكيد كلمة السر"
              value={pwd.confirm}
              onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))} aria-label="إظهار كلمة السر">
              <EyeIcon open={showPwd.confirm} />
            </button>
          </div>

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "جارِ الحفظ..." : "حفظ كلمة السر"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="orders-wrap"><div className="empty-state">جارِ التحميل...</div></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
