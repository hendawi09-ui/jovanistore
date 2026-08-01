"use client";
import { useCallback, useEffect, useState } from "react";
import { showToast } from "@/components/Toast";
import { compressImage, compressionLabel } from "@/lib/compressImage";

export default function AdminHeroPage() {
  const [slides, setSlides] = useState([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/hero");
    if (res.ok) {
      const data = await res.json();
      setEnabled(data?.enabled !== false);
      setSlides(Array.isArray(data?.slides) ? data.slides : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  function updateLocal(id, patch) {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  async function handleToggleAll() {
    const next = !enabled;
    const res = await fetch("/api/hero", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    if (res.ok) {
      setEnabled(next);
      showToast(next ? "تم تشغيل السلايدر" : "تم إلغاء السلايدر من الصفحة الرئيسية");
    } else {
      showToast("حدث خطأ");
    }
  }

  async function handleAdd() {
    const res = await fetch("/api/hero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "سلايد جديد",
        description: "",
        ctaLabel: "اكتشف المزيد",
        ctaLink: "/#products",
      }),
    });
    if (res.ok) { showToast("تمت إضافة سلايد جديد"); refresh(); }
    else showToast("حدث خطأ أثناء الإضافة");
  }

  async function handleSave(s) {
    const res = await fetch(`/api/hero/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: s.title,
        description: s.description,
        ctaLabel: s.ctaLabel,
        ctaLink: s.ctaLink,
        badge: s.badge,
        image: s.image,
      }),
    });
    showToast(res.ok ? "تم الحفظ" : "حدث خطأ أثناء الحفظ");
  }

  async function handleTogglePublish(s) {
    const res = await fetch(`/api/hero/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !s.published }),
    });
    if (res.ok) {
      showToast(s.published ? "تم إخفاء السلايد" : "تم نشر السلايد");
      refresh();
    }
  }

  async function handleDelete(id) {
    if (!confirm("متأكد إنك عايز تحذف السلايد ده نهائيًا؟")) return;
    const res = await fetch(`/api/hero/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("تم الحذف"); refresh(); }
  }

  async function handleDeleteAll() {
    if (slides.length === 0) return;
    if (!confirm(`متأكد إنك عايز تحذف كل السلايدات (${slides.length}) نهائيًا؟ مش هينفع ترجعها.`)) return;
    await Promise.all(slides.map((s) => fetch(`/api/hero/${s.id}`, { method: "DELETE" })));
    showToast("تم حذف كل السلايدات");
    refresh();
  }

  async function handleMove(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= slides.length) return;
    const a = slides[index];
    const b = slides[target];
    await Promise.all([
      fetch(`/api/hero/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: b.sortOrder }),
      }),
      fetch(`/api/hero/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: a.sortOrder }),
      }),
    ]);
    refresh();
  }

  async function handleImageChange(s, file) {
    setUploadingId(s.id);
    const small = await compressImage(file);
    const saved = compressionLabel(file.size, small.size);
    const fd = new FormData();
    fd.append("file", small);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        updateLocal(s.id, { image: data.url });
        await fetch(`/api/hero/${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: data.url }),
        });
        showToast(saved ? `تم تحديث الصورة · ${saved}` : "تم تحديث الصورة");
      } else {
        showToast(data.error || "فشل رفع الصورة");
      }
    } catch {
      showToast("فشل رفع الصورة");
    }
    setUploadingId(null);
  }

  const tabs = (
    <div className="admin-tabs">
      <a href="/admin/dashboard" className="admin-tab">لوحة المعلومات</a>
      <a href="/admin" className="admin-tab">المنتجات</a>
      <a href="/admin/orders" className="admin-tab">طلبات الشراء</a>
      <a href="/admin/returns" className="admin-tab">الاسترجاع والاستبدال</a>
      <a href="/admin/coupons" className="admin-tab">كوبونات الخصم</a>
      <span className="admin-tab active">هيرو الرئيسية</span>
    </div>
  );

  if (loading) {
    return (
      <div className="admin-wrap">
        {tabs}
        <div className="note-box">جارِ التحميل...</div>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      {tabs}

      <div className="guide-box">
        هنا بتتحكم في صور وسلايدات هيرو الصفحة الرئيسية. كل بطاقة = صورة واحدة بتظهر في السلايدر.
        ارفع صورة، اكتب عنوان ووصف وزرار خاص بيها، رتّبها بالسهمين، أو اخفيها من غير ما تحذفها.
      </div>

      {/* زرار رئيسي: تشغيل / إلغاء السلايدر كله */}
      <div className={`hero-master ${enabled ? "on" : "off"}`}>
        <div className="hero-master-text">
          <strong>{enabled ? "السلايدر شغّال على الصفحة الرئيسية" : "السلايدر متوقف"}</strong>
          <span>
            {enabled
              ? "لو ألغيته، السلايدر هيختفي خالص من الرئيسية وتفضل جملة الترحيب بس — من غير ما تتحذف أي سلايدة."
              : "السلايدر مخفي حاليًا والصفحة الرئيسية فيها جملة الترحيب بس. سلايداتك محفوظة زي ما هي."}
          </span>
        </div>
        <button className={enabled ? "master-off-btn" : "master-on-btn"} onClick={handleToggleAll}>
          {enabled ? "إلغاء السلايدر" : "تشغيل السلايدر"}
        </button>
      </div>

      <div className="section-head" style={{ margin: "0 0 12px", padding: 0 }}>
        <h2>سلايدات الهيرو <span>({slides.length})</span></h2>
        <div style={{ display: "flex", gap: 8 }}>
          {slides.length > 0 && (
            <button className="del-btn" onClick={handleDeleteAll} style={{ padding: "11px 18px", borderRadius: 12 }}>
              حذف الكل
            </button>
          )}
          <button className="hero-add-btn" onClick={handleAdd}>+ إضافة سلايد جديد</button>
        </div>
      </div>

      {slides.length === 0 ? (
        <div className="note-box">مفيش سلايدات. دوس &laquo;إضافة سلايد جديد&raquo; عشان تبدأ.</div>
      ) : (
        <div className="hero-cards">
          {slides.map((s, i) => (
            <div className="hcard" key={s.id}>
              <div className="hcard-media">
                {s.image ? <img src={s.image} alt="" /> : <div className="hcard-media-empty">بدون صورة</div>}
                <span className="hcard-order">الترتيب: {i + 1}</span>
                <span className={`hcard-pub ${s.published ? "pub-yes" : "pub-no"}`}>
                  {s.published ? "منشور" : "مخفي"}
                </span>
                <div className="hcard-move">
                  <button className="hero-move-btn" onClick={() => handleMove(i, -1)} disabled={i === 0}>▲</button>
                  <button className="hero-move-btn" onClick={() => handleMove(i, 1)} disabled={i === slides.length - 1}>▼</button>
                </div>
                <label className="upload-btn">
                  {uploadingId === s.id ? "جارِ الرفع..." : "تغيير الصورة"}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files[0]) handleImageChange(s, e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <div className="hcard-body">
                <div>
                  <span className="field-label">العنوان</span>
                  <input className="field-input" value={s.title}
                    onChange={(e) => updateLocal(s.id, { title: e.target.value })} />
                </div>
                <div>
                  <span className="field-label">الوصف القصير</span>
                  <textarea className="field-textarea" value={s.description}
                    onChange={(e) => updateLocal(s.id, { description: e.target.value })} />
                </div>
                <div className="field-row">
                  <div>
                    <span className="field-label">نص الزرار</span>
                    <input className="field-input" value={s.ctaLabel}
                      onChange={(e) => updateLocal(s.id, { ctaLabel: e.target.value })} />
                  </div>
                  <div>
                    <span className="field-label">رابط الزرار</span>
                    <input className="field-input" value={s.ctaLink} placeholder="/?cat=men"
                      onChange={(e) => updateLocal(s.id, { ctaLink: e.target.value })} />
                  </div>
                </div>
                <div>
                  <span className="field-label">شارة اختيارية (زي: خصم 30%)</span>
                  <input className="field-input" value={s.badge || ""} placeholder="سيبها فاضية لو مفيش"
                    onChange={(e) => updateLocal(s.id, { badge: e.target.value })} />
                </div>
                <div className="hcard-actions">
                  <button className="save-btn" onClick={() => handleSave(s)}>حفظ التعديل</button>
                  <button className="pub-btn" onClick={() => handleTogglePublish(s)}>
                    {s.published ? "إخفاء" : "نشر"}
                  </button>
                  <button className="del-btn" onClick={() => handleDelete(s.id)}>حذف</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
