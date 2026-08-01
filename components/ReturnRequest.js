"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/StoreContext";
import { parseSize } from "@/lib/products";
import { policy } from "@/lib/siteConfig";
import { showToast } from "@/components/Toast";

const REASONS = [
  "المقاس مش مظبوط",
  "المنتج مختلف عن الصور",
  "فيه عيب في المنتج",
  "وصلني منتج غلط",
  "غيّرت رأيي",
  "سبب تاني",
];

// بيرجّع عدد الأيام الباقية في مدة الاسترجاع، أو null لو خلصت
export function returnDaysLeft(order) {
  const status = order.status || "pending";
  if (status !== "delivered") return null;
  const base = order.delivered_at || order.created_at;
  if (!base) return null;
  const passed = Math.floor((Date.now() - new Date(base).getTime()) / 86400000);
  const left = policy.returnDays - passed;
  return left >= 0 ? left : null;
}

export default function ReturnRequest({ order }) {
  const { products } = useStore();
  const [mode, setMode] = useState(null); // null | 'return' | 'exchange'
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const items = Array.isArray(order.items) ? order.items : [];
  const [itemIdx, setItemIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [wantedSize, setWantedSize] = useState("");
  const [wantedColor, setWantedColor] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");

  const daysLeft = returnDaysLeft(order);
  const item = items[itemIdx];

  // المقاسات والألوان المتاحة لنفس المنتج — بنجيبها من المتجر عشان يختار مش يكتب
  const variants = useMemo(() => {
    const p = products.find((x) => String(x.id) === String(item?.productId));
    if (!p) return { sizes: [], colors: [] };
    const sizes = (p.sizes || []).map((s) => parseSize(s).name).filter(Boolean);
    const colors = p.colorName ? [p.colorName] : [];
    return { sizes, colors };
  }, [products, item]);

  if (daysLeft === null || !item) return null;

  const urgent = daysLeft <= 3;

  async function submit() {
    if (mode === "exchange" && !wantedSize && !wantedColor) {
      showToast("اختار المقاس أو اللون اللي عايزه");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          phone: order.phone,
          kind: mode,
          itemName: item.name,
          itemQty: qty,
          wantedSize,
          wantedColor,
          reason,
          note,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        showToast("تم إرسال طلبك");
      } else {
        showToast(data.error || "حصل خطأ، حاول تاني");
      }
    } catch {
      showToast("حصل خطأ، حاول تاني");
    }
    setBusy(false);
  }

  if (sent) {
    return (
      <div className="rr-done">
        ✅ <strong>تم استلام طلبك</strong> — هنراجعه ونكلّمك على رقم موبايلك خلال يوم عمل.
      </div>
    );
  }

  return (
    <>
      <div className={`return-note ${urgent ? "urgent" : ""}`}>
        تقدر تطلب <strong>استبدال أو استرجاع</strong> للطلب ده
        <span className="return-days">
          {daysLeft === 0 ? "آخر يوم النهاردة" : `باقي ${daysLeft} يوم`}
        </span>
        <br />
        اطّلع على <Link href="/policies#returns">شروط الاسترجاع</Link> الأول.
      </div>

      {!mode && (
        <div className="rr-actions">
          <button className="rr-btn" onClick={() => setMode("exchange")}>
            طلب استبدال
          </button>
          <button className="rr-btn rr-return" onClick={() => setMode("return")}>
            طلب استرجاع
          </button>
        </div>
      )}

      {mode && (
        <div className="rr-form">
          <h4>{mode === "return" ? "طلب استرجاع" : "طلب استبدال"}</h4>

          <div className="rr-field">
            <span className="rr-label">القطعة</span>
            <select
              className="rr-select"
              value={itemIdx}
              onChange={(e) => {
                setItemIdx(Number(e.target.value));
                setQty(1);
                setWantedSize("");
                setWantedColor("");
              }}
            >
              {items.map((it, i) => (
                <option key={i} value={i}>
                  {it.name} (الكمية {it.qty})
                </option>
              ))}
            </select>
          </div>

          <div className="rr-field">
            <span className="rr-label">الكمية</span>
            <select className="rr-select" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
              {Array.from({ length: Math.max(1, Number(item.qty) || 1) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {mode === "exchange" && (
            <div className="rr-field">
              <span className="rr-label">عايز تستبدلها بإيه؟ (نفس المنتج)</span>
              <div className="rr-grid2">
                <div>
                  <span className="rr-sublabel">المقاس</span>
                  {variants.sizes.length > 0 ? (
                    <select className="rr-select" value={wantedSize} onChange={(e) => setWantedSize(e.target.value)}>
                      <option value="">— نفس المقاس —</option>
                      {variants.sizes.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="rr-input"
                      value={wantedSize}
                      onChange={(e) => setWantedSize(e.target.value)}
                      placeholder="مثال: L"
                    />
                  )}
                </div>
                <div>
                  <span className="rr-sublabel">اللون</span>
                  <input
                    className="rr-input"
                    value={wantedColor}
                    onChange={(e) => setWantedColor(e.target.value)}
                    placeholder="سيبه فاضي لو نفس اللون"
                  />
                </div>
              </div>
              <div className="rr-hint">الاستبدال بنفس المنتج فقط — مقاس تاني أو لون تاني.</div>
            </div>
          )}

          <div className="rr-field">
            <span className="rr-label">السبب</span>
            <select className="rr-select" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="rr-field">
            <span className="rr-label">تفاصيل إضافية (اختياري)</span>
            <textarea
              className="rr-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اكتب أي تفاصيل تساعدنا"
            />
          </div>

          <div className="rr-foot">
            <button className="rr-submit" disabled={busy} onClick={submit}>
              {busy ? "جارِ الإرسال..." : "إرسال الطلب"}
            </button>
            <button className="rr-cancel" disabled={busy} onClick={() => setMode(null)}>
              تراجع
            </button>
          </div>
          <div className="rr-hint">هنراجع طلبك ونتواصل معاك على رقم موبايلك خلال يوم عمل.</div>
        </div>
      )}
    </>
  );
}
