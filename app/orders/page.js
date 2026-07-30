"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/StoreContext";
import { showToast } from "@/components/Toast";

const STATUS = {
  pending: { label: "قيد الانتظار", cls: "st-pending" },
  confirmed: { label: "تم التأكيد", cls: "st-confirmed" },
  shipped: { label: "تم الشحن", cls: "st-shipped" },
  delivered: { label: "تم التسليم", cls: "st-delivered" },
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
  const [authBusy, setAuthBusy] = useState(false);
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
            <input
              type="password"
              required
              placeholder="كلمة السر"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={authBusy}>
              {authBusy ? "جارِ التنفيذ..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
            </button>
          </form>

          <div className="oauth-divider"><span>أو</span></div>

          <div className="oauth-buttons">
            <a href="/api/auth/google" className="oauth-btn oauth-google">
              الدخول بحساب جوجل
            </a>
            <a href="/api/auth/facebook" className="oauth-btn oauth-facebook">
              الدخول بحساب فيسبوك
            </a>
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

              {!canCancel && status !== "cancelled" && (
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
