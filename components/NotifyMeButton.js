"use client";
import { useState } from "react";
import { useStore } from "@/lib/StoreContext";
import { showToast } from "./Toast";

// زرار "عرّفني لما يتوفر" — بيظهر مكان زرار الشراء لما المقاس يكون نافد.
// لو الزبون مسجّل دخول، بناخد بياناته على طول من غير ما نسأله تاني.
export default function NotifyMeButton({ product, size, color }) {
  const { account } = useStore();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const signedIn = Boolean(account?.phone);

  async function register(usePhone, useEmail) {
    if (sending) return;
    setSending(true);

    const res = await fetch("/api/stock-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        productName: product.name,
        phone: usePhone,
        email: useEmail,
        size: size || "",
        color: color || product.colorName || "",
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSending(false);

    if (!res.ok) {
      showToast(data.error || "حصل خطأ، حاول تاني");
      return;
    }

    showToast(
      data.already
        ? "إنت مسجّل بالفعل — هنبعتلك أول ما يتوفر"
        : "تمام ✓ هنبعتلك رسالة أول ما المقاس يتوفر"
    );
    setDone(true);
    setOpen(false);
    setPhone("");
    setEmail("");
  }

  if (done) {
    return (
      <div className="notify-done">
        ✓ سجّلناك — هنبعتلك أول ما {size ? `مقاس ${size}` : "المنتج"} يتوفر
      </div>
    );
  }

  // الزبون مسجّل دخول → تسجيل مباشر بضغطة واحدة
  if (signedIn) {
    return (
      <button
        className="notify-btn"
        disabled={sending}
        onClick={() => register(account.phone, account.email || "")}
      >
        {sending ? "جارٍ التسجيل..." : "🔔 عرّفني لما يتوفر"}
      </button>
    );
  }

  if (!open) {
    return (
      <button className="notify-btn" onClick={() => setOpen(true)}>
        🔔 عرّفني لما يتوفر
      </button>
    );
  }

  return (
    <form
      className="notify-form"
      onSubmit={(e) => {
        e.preventDefault();
        register(phone, email);
      }}
    >
      <p className="notify-hint">
        سيب بياناتك وهنبعتلك رسالة واتساب أول ما {size ? `مقاس ${size}` : "المنتج"} يرجع يتوفر.
      </p>

      <input
        type="tel"
        inputMode="numeric"
        required
        autoFocus
        placeholder="رقم الواتساب — 01xxxxxxxxx"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <input
        type="email"
        placeholder="الإيميل (اختياري)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="notify-row">
        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? "جارٍ التسجيل..." : "سجّلني"}
        </button>
        <button type="button" className="notify-cancel" onClick={() => setOpen(false)}>
          إلغاء
        </button>
      </div>
    </form>
  );
}
