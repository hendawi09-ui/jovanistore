"use client";
import { useEffect, useRef, useState } from "react";
import { showToast } from "./Toast";

// زرار مشاركة واحد:
// - على الموبايل: بيفتح قائمة المشاركة الأصلية بتاعة النظام (فيها كل تطبيقات العميل)
// - على الديسكتوب: بيفتح قائمة صغيرة من الموقع
export default function ShareButton({ title, text }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // قفل القائمة عند الضغط بره أو بزرار Escape
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function currentUrl() {
    return typeof window !== "undefined" ? window.location.href : "";
  }

  async function handleMainClick() {
    const url = currentUrl();
    // قائمة النظام الأصلية (متاحة على الموبايل غالبًا)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // العميل قفل القائمة أو رفض — منعملش حاجة
        return;
      }
    }
    setOpen((v) => !v);
  }

  function shareTo(platform) {
    const url = encodeURIComponent(currentUrl());
    const msg = encodeURIComponent(`${title}${text ? " — " + text : ""}`);
    const links = {
      whatsapp: `https://wa.me/?text=${msg}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${msg}`,
    };
    window.open(links[platform], "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(currentUrl());
      showToast("تم نسخ رابط المنتج ✓");
    } catch {
      showToast("تعذّر نسخ الرابط");
    }
    setOpen(false);
  }

  return (
    <div className="share-wrap" ref={wrapRef}>
      {open && (
        <div className="share-menu">
          <button className="share-item wa" onClick={() => shareTo("whatsapp")}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-5.8c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.6.2s-.7.9-.9 1.1c-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.2-.6-1.5-.9-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3z" /></svg>
            مشاركة على واتساب
          </button>
          <button className="share-item fb" onClick={() => shareTo("facebook")}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" /></svg>
            مشاركة على فيسبوك
          </button>
          <button className="share-item tg" onClick={() => shareTo("telegram")}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.7 19c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.3 12.9l-4.8-1.5c-1-.3-1-1 .2-1.5l18.8-7.2c.9-.3 1.6.2 1.4 1.6z" /></svg>
            مشاركة على تيليجرام
          </button>
          <button className="share-item cp" onClick={copyLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
            نسخ رابط المنتج
          </button>
        </div>
      )}

      <button className="share-main" onClick={handleMainClick} aria-label="مشاركة المنتج">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        شارك المنتج
      </button>
    </div>
  );
}
