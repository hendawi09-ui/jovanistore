"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/StoreContext";
import { showToast } from "@/components/Toast";

// ⚙️ مفتاح زرار "الدخول بحساب فيسبوك"
// مخفي حاليًا لأن Meta مش بتحفظ روابط الرجوع (Valid OAuth Redirect URIs) في التطبيق.
// لما المشكلة دي تتحل، غيّر false لـ true وهيرجع الزرار زي ما كان.
const SHOW_FACEBOOK_LOGIN = false;

const STATUS = {
  pending: { label: "قيد الانتظار", cls: "st-pending" },
  confirmed: { label: "تم التأكيد", cls: "st-confirmed" },
  shipped: { label: "تم الشحن", cls: "st-shipped" },
  delivered: { label: "تم التسليم", cls: "st-delivered" },
  returned: { label: "مسترجع", cls: "st-returned" },
  cancelled: { label: "ملغي", cls: "st-cancelled" },
};

function OrdersContent() {
  const { orders, cancelOrder, account, loginAccount, registerAccount, logoutAccount } = useStore();
  const [confirmId, setConfirmId] = useState(null); // الطلب اللي بيستنى تأكيد الإلغاء
  const [busy, setBusy] = useState(false);

  // شاشة الدخول / إنشاء حساب
  const [mode, setMode] = useState("login"); // login | register
  const [phoneInput, setPhoneInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  // استرجاع كلمة السر
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotInput, setForgotInput] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setForgotBusy(true);
    const res = await fetch("/api/account/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: forgotInput }),
    });
    const data = await res.json().catch(() => ({}));
    setForgotBusy(false);
    if (!res.ok) {
      showToast(data.error || "حصل خطأ");
      return;
    }
    setForgotInput("");
    setForgotMode(false);
    showToast(data.message || "لو الحساب موجود، هيوصلك إيميل فيه رابط إعادة التعيين");
  }
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("oauth_error")) {
      showToast("تعذّر تسجيل الدخول، حاول تاني");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doCancel(order) {
    setBusy(true);
    const { ok, error } = await cancelOrder(order.id, order.phone);
    setBusy(false);
    setConfirmId(null);
    showToast(ok ? "تم إلغاء طلبك" : error || "تعذّر إلغاء الطلب");
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthBusy(true);
    const action = mode === "login" ? loginAccount : registerAccount;
    const { ok, error } = await action(phoneInput, passwordInput);
    setAuthBusy(false);
    if (!ok) {
      showToast(error || "حصل خطأ");
      return;
    }
    if (mode === "register") {
      showToast("تم إنشاء حسابك 🎉 كمّل بياناتك عشان الطلب الجاي يبقى أسرع");
    }
  }

  // لو العميل مش داخل حسابه لسه، نعرضله شاشة الدخول / إنشاء حساب
  if (!account) {
    return (
      <div className="orders-wrap">
        <div className="section-head" style={{ margin: "0 0 24px", padding: 0 }}><h2>حسابي</h2></div>
        <div className="account-login-box">
          <div className="account-tabs">
            <button
              className={`account-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => setMode("login")}
              type="button"
            >
              تسجيل دخول
            </button>
            <button
              className={`account-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => setMode("register")}
              type="button"
            >
              حساب جديد
            </button>
          </div>

          <p className="account-login-hint">
            {mode === "login"
              ? "ادخل برقم موبايلك وكلمة السر عشان تشوف كل طلباتك من أي جهاز."
              : "أنشئ حساب برقم موبايلك وكلمة سر تختارها، وهنطلب منك بياناتك (الاسم والعنوان) بعد كده عشان طلباتك الجاية تبقى أسرع."}
          </p>
          <form onSubmit={handleAuthSubmit} className="account-login-form">
            <input
              type="tel"
              required
              placeholder="رقم الموبايل 01xxxxxxxxx"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
            />
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="كلمة السر"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
                title={showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
              >
                {showPassword ? (
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
                )}
              </button>
            </div>
            <button type="submit" className="btn-primary" disabled={authBusy}>
              {authBusy ? "جارِ التنفيذ..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
            </button>
          </form>

          {mode === "login" && !forgotMode && (
            <button type="button" className="forgot-link" onClick={() => setForgotMode(true)}>
              نسيت كلمة السر؟
            </button>
          )}

          {forgotMode && (
            <div className="forgot-box">
              <p className="forgot-hint">
                اكتب رقم موبايلك أو إيميلك، وهنبعتلك رابط على إيميلك تعيّن منه كلمة سر جديدة.
              </p>
              <form onSubmit={handleForgotSubmit} className="account-login-form">
                <input
                  type="text"
                  required
                  placeholder="رقم الموبايل أو الإيميل"
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                />
                <button type="submit" className="btn-primary" disabled={forgotBusy}>
                  {forgotBusy ? "جارِ الإرسال..." : "إرسال رابط الاسترجاع"}
                </button>
              </form>
              <button type="button" className="forgot-link" onClick={() => setForgotMode(false)}>
                رجوع لتسجيل الدخول
              </button>
            </div>
          )}

          <div className="oauth-divider"><span>أو</span></div>

          <div className="oauth-buttons">
            <a href="/api/auth/google" className="oauth-btn oauth-google">
              الدخول بحساب جوجل
            </a>
            {SHOW_FACEBOOK_LOGIN && (
              <a href="/api/auth/facebook" className="oauth-btn oauth-facebook">
                الدخول بحساب فيسبوك
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // العميل داخل حسابه، بس لسه ماكملش بياناته (اسم/موبايل/عنوان) — نوجّهه لصفحة إكمال البيانات
  if (!account.name || !account.phone) {
    return (
      <div className="orders-wrap">
        <div className="section-head" style={{ margin: "0 0 24px", padding: 0 }}><h2>حسابي</h2></div>
        <div className="account-login-box">
          <p className="account-login-hint">
            حسابك اتعمل بنجاح 🎉 كمّل بياناتك (الاسم، المحافظة، العنوان) عشان تستخدمها في كل طلب جاي من غير ما تكتبها تاني.
          </p>
          <Link href="/account/profile" className="btn-primary" style={{ display: "inline-block", textAlign: "center" }}>
            كمّل بياناتي الآن
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-wrap">
      <div className="section-head account-head" style={{ margin: "0 0 24px", padding: 0 }}>
        <h2>حسابي</h2>
        <div className="account-info">
          <span className="account-phone">{account.name} · {account.phone}</span>
          <Link href="/account/profile" className="account-edit-btn">بياناتي</Link>
          <button className="account-logout-btn" onClick={logoutAccount}>تسجيل خروج</button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          لا توجد طلبات بحسابك بعد.<br /><br />
          <Link href="/" className="btn-primary">ابدأ التسوّق</Link>
        </div>
      ) : (
        orders.map((o) => {
          const status = o.status || "pending";
          const info = STATUS[status] || STATUS.pending;
          const canCancel = status === "pending";

          return (
            <div className="order-card" key={o.id}>
              <div className="order-top">
                <strong>طلب #{o.id}</strong>
                <span className={`badge ${info.cls}`}>{info.label}</span>
              </div>
              <div className="order-items">{o.items.map((i) => `${i.name} × ${i.qty}`).join("، ")}</div>
              <div className="order-items">
                {o.date} — التوصيل إلى {o.city} — {o.pay === "cod" ? "الدفع عند الاستلام" : "بطاقة (تجريبي)"}
              </div>
              <div className="order-total">{o.total} ج.م</div>

              {canCancel && confirmId !== o.id && (
                <button className="cancel-order-btn" onClick={() => setConfirmId(o.id)}>
                  إلغاء الطلب
                </button>
              )}

              {canCancel && confirmId === o.id && (
                <div className="cancel-confirm">
                  <span>متأكد إنك عايز تلغي الطلب ده؟ الإجراء ده نهائي.</span>
                  <div className="cancel-actions">
                    <button className="cancel-yes" disabled={busy} onClick={() => doCancel(o)}>
                      {busy ? "جارِ الإلغاء..." : "نعم، ألغِ الطلب"}
                    </button>
                    <button className="cancel-no" disabled={busy} onClick={() => setConfirmId(null)}>
                      تراجع
                    </button>
                  </div>
                </div>
              )}

              {!canCancel && status !== "cancelled" && status !== "returned" && (
                <div className="order-note">
                  تم تأكيد الطلب — للإلغاء أو التعديل تواصل معنا عبر{" "}
                  <Link href="/policies#contact">صفحة التواصل</Link>.
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// نغلّف الصفحة بـ Suspense لأن useSearchParams بيقرأ من الرابط،
// وده بيمنع فشل البناء وقت النشر على Vercel
export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="orders-wrap"><div className="empty-state">جارِ التحميل...</div></div>}>
      <OrdersContent />
    </Suspense>
  );
}
