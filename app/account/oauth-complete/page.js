"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/StoreContext";
import { showToast } from "@/components/Toast";

function OAuthCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { applyOAuthSession } = useStore();
  const [status] = useState("جارِ تسجيل الدخول...");

  useEffect(() => {
    const token = searchParams.get("login_token");
    if (!token) {
      router.replace("/orders?oauth_error=1");
      return;
    }
    (async () => {
      const res = await fetch("/api/account/oauth-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_token: token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || "تعذّر تسجيل الدخول");
        router.replace("/orders?oauth_error=1");
        return;
      }
      await applyOAuthSession(data);
      router.replace("/orders");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="orders-wrap">
      <div className="empty-state">{status}</div>
    </div>
  );
}

// نغلّف الصفحة بـ Suspense لأن useSearchParams بيقرأ رمز الدخول من الرابط
export default function OAuthCompletePage() {
  return (
    <Suspense fallback={<div className="orders-wrap"><div className="empty-state">جارِ تسجيل الدخول...</div></div>}>
      <OAuthCompleteContent />
    </Suspense>
  );
}
