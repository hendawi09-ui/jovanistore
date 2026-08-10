"use client";
import { useState } from "react";
import { showToast } from "./Toast";

// زرار "عرّفني لما يتوفر" — بيظهر مكان زرار الشراء لما المقاس يكون نافد.
export default function NotifyMeButton({ product, size, color }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (sending) return;
    setSending(true);

    const res = await fetch("/api/stock-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        productName: product.name,
        phone,
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
        ? "رقمك مسجّل بالفعل — هنكلمك أول ما يتوفر"
        : "تمام ✓ هنكلمك أول ما المقاس يتوفر"
    );
    setOpen(false);
    setPhone("");
  }

  if (!open) {
    return (
      <button className="notify-btn" onClick={() => setOpen(true)}>
        🔔 عرّفني لما يتوفر
      </button>
    );
  }

  return (
    <form className="notify-form" onSubmit={submit}>
      <p className="notify-hint">
        اكتب رقم موبايلك وهنكلمك أول ما {size ? `مقاس ${size}` : "المنتج"} يرجع يتوفر.
      </p>
      <div className="notify-row">
        <input
          type="tel"
          inputMode="numeric"
          required
          autoFocus
          placeholder="01xxxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? "..." : "تأكيد"}
        </button>
      </div>
      <button type="button" className="notify-cancel" onClick={() => setOpen(false)}>
        إلغاء
      </button>
    </form>
  );
}
