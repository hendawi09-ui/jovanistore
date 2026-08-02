"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { showToast } from "@/components/Toast";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      showToast(data.error || "حصل خطأ، حاول تاني");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="orders-wrap">
      <div className="section-head" style={{ margin: "0 0 24px", padding: 0 }}>
        <h2>لوحة تحكم Jovani</h2>
      </div>
      <div className="account-login-box">
        <p className="account-login-hint">سجّل دخولك للمتابعة.</p>
        <form onSubmit={handleSubmit} className="account-login-form">
          <div className="password-field">
            <input
              type={showPwd ? "text" : "password"}
              required
              autoFocus
              placeholder="كلمة السر"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPwd((s) => !s)}
              aria-label="إظهار كلمة السر"
            >
              {showPwd ? "🙈" : "👁"}
            </button>
          </div>

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "جارِ الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="orders-wrap"><div className="empty-state">جارِ التحميل...</div></div>}>
      <AdminLoginContent />
    </Suspense>
  );
}
