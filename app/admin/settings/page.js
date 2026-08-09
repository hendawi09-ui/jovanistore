"use client";
import { useCallback, useEffect, useState } from "react";
import AdminTabs from "@/components/AdminTabs";
import { showToast } from "@/components/Toast";

const MODES = [
  {
    id: "all",
    label: "المتجر كامل",
    desc: "الرجالي والنسائي الاتنين ظاهرين للزوار — الوضع الطبيعي.",
    emoji: "🛍️",
  },
  {
    id: "women",
    label: "نسائي فقط",
    desc: "الزوار هيشوفوا المنتجات النسائية بس. الرجالي بيتخفي من المتجر تمامًا من غير ما يتحذف.",
    emoji: "👗",
  },
  {
    id: "men",
    label: "رجالي فقط",
    desc: "الزوار هيشوفوا المنتجات الرجالي بس. النسائي بيتخفي من المتجر تمامًا من غير ما يتحذف.",
    emoji: "👔",
  },
];

export default function AdminSettingsPage() {
  const [mode, setMode] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/store-mode", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      if (d?.mode) setMode(d.mode);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function changeMode(next) {
    if (next === mode || saving) return;

    const prev = mode;
    setMode(next); // تحديث فوري للشاشة
    setSaving(true);

    const res = await fetch("/api/store-mode", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: next }),
    });

    setSaving(false);

    if (!res.ok) {
      setMode(prev);
      showToast("فشل الحفظ — رجعنا الوضع القديم");
      return;
    }
    showToast("اتحفظ ✓ التغيير شغّال على الموقع فورًا");
  }

  return (
    <div className="orders-wrap">
      <AdminTabs active="/admin/settings" />

      <div className="section-head" style={{ margin: "0 0 6px", padding: 0 }}>
        <h2>إعدادات المتجر</h2>
      </div>
      <div className="guide-box" style={{ marginBottom: 18 }}>
        تحكّم في اللي الزوار بيشوفوه على الموقع. أي منتج بيتخفي هنا بيفضل موجود في لوحة التحكم زي ما هو.
      </div>

      {loading ? (
        <div className="empty-state">جارِ التحميل...</div>
      ) : (
        <>
          <h3 className="settings-label">وضع عرض المتجر</h3>
          <div className="mode-grid">
            {MODES.map((m) => (
              <button
                key={m.id}
                className={`mode-card ${mode === m.id ? "active" : ""}`}
                onClick={() => changeMode(m.id)}
                disabled={saving}
              >
                <span className="mode-emoji">{m.emoji}</span>
                <strong>{m.label}</strong>
                <span className="mode-desc">{m.desc}</span>
                {mode === m.id && <span className="mode-badge">مفعّل حاليًا</span>}
              </button>
            ))}
          </div>

          {mode !== "all" && (
            <div className="mode-warning">
              ⚠️ المتجر شغّال دلوقتي بقسم واحد بس. المنتجات التانية مخفية عن الزوار —
              ولو حد فتح رابط منتج منها مباشرة، مش هيلاقيه. ارجع لـ«المتجر كامل» في أي وقت.
            </div>
          )}
        </>
      )}
    </div>
  );
}
