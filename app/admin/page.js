"use client";
import { useState, useRef } from "react";
import { useStore } from "@/lib/StoreContext";
import { IconSvg, icons } from "@/lib/icons";
import { catCssVar, catLabel } from "@/lib/products";
import { showToast } from "@/components/Toast";

const emptyForm = { name: "", price: "", cat: "men", icon: "shirt", desc: "", colors: "", sizes: "" };

export default function AdminPage() {
  const { products, addProduct, updateProduct, deleteProduct, togglePublish, reorderProducts } = useStore();
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]); // uploaded image URLs for the product being added/edited
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = وضع إضافة، غير null = وضع تعديل
  const formTopRef = useRef(null);

  const dragId = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [reordering, setReordering] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && data.url) {
          setImages((prev) => [...prev, data.url]);
        } else {
          showToast(data.error || "فشل رفع صورة");
        }
      } catch {
        showToast("فشل رفع صورة");
      }
    }
    setUploading(false);
    e.target.value = "";
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      price: String(p.price ?? ""),
      cat: p.cat || "men",
      icon: p.icon || "shirt",
      desc: p.desc || "",
      colors: (p.colors || []).join(", "),
      sizes: (p.sizes || []).join(", "),
    });
    setImages(p.images || []);
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setImages([]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const colors = form.colors.split(",").map((s) => s.trim()).filter(Boolean);
    const sizes = form.sizes.split(",").map((s) => s.trim()).filter(Boolean);
    const payload = {
      cat: form.cat,
      icon: form.icon,
      name: form.name,
      desc: form.desc || "منتج جديد من Jovani Store.",
      price: Number(form.price),
      images,
      colors,
      sizes,
    };

    if (editingId) {
      updateProduct(editingId, payload).then((ok) => {
        showToast(ok ? "تم حفظ التعديلات" : "حدث خطأ أثناء الحفظ");
      });
    } else {
      addProduct(payload).then((ok) => {
        showToast(ok ? "تمت إضافة المنتج" : "حدث خطأ أثناء الحفظ");
      });
    }

    setEditingId(null);
    setForm(emptyForm);
    setImages([]);
  }

  function handleDelete(id) {
    deleteProduct(id).then((ok) => {
      showToast(ok ? "تم حذف المنتج" : "حدث خطأ أثناء الحذف");
    });
    if (editingId === id) cancelEdit();
  }

  function handleTogglePublish(p) {
    const next = !(p.published !== false);
    togglePublish(p.id, next).then((ok) => {
      showToast(ok ? (next ? "تم نشر المنتج" : "تم إخفاء المنتج") : "حدث خطأ");
    });
  }

  // ------- سحب وإفلات لإعادة الترتيب (داخل نفس المجموعة بس: منشور مع منشور، وغير منشور مع غير منشور) -------
  function onDragStart(id) {
    dragId.current = id;
  }
  function onDragOver(e, id, group) {
    e.preventDefault();
    const sourceP = products.find((p) => p.id === dragId.current);
    const sourceGroup = sourceP ? sourceP.published !== false : null;
    if (id !== dragId.current && sourceGroup === group) setDragOverId(id);
  }
  function onDragLeave() {
    setDragOverId(null);
  }
  async function onDrop(e, targetId, group) {
    e.preventDefault();
    setDragOverId(null);
    const sourceId = dragId.current;
    dragId.current = null;
    if (!sourceId || sourceId === targetId) return;

    const sourceP = products.find((p) => p.id === sourceId);
    const sourceGroup = sourceP ? sourceP.published !== false : null;
    if (!sourceP || sourceGroup !== group) return; // امنع السحب بين مجموعتين مختلفتين

    const ids = products.map((p) => p.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;

    ids.splice(from, 1);
    ids.splice(to, 0, sourceId);

    setReordering(true);
    const ok = await reorderProducts(ids);
    setReordering(false);
    if (!ok) showToast("حدث خطأ أثناء إعادة الترتيب");
  }

  function renderCard(p, group) {
    const isPublished = p.published !== false;
    return (
      <div
        key={p.id}
        draggable
        onDragStart={() => onDragStart(p.id)}
        onDragOver={(e) => onDragOver(e, p.id, group)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, p.id, group)}
        className={`admin-pcard ${dragOverId === p.id ? "drag-over" : ""} ${reordering ? "reordering" : ""} ${editingId === p.id ? "editing" : ""} ${!isPublished ? "unpublished" : ""}`}
      >
        <div className="admin-pcard-handle" title="اسحب لإعادة الترتيب">⠿⠿</div>
        <div className="admin-pcard-media" style={{ "--c": `var(${catCssVar[p.cat]})` }}>
          {p.images && p.images[0] ? (
            <img src={p.images[0]} alt="" />
          ) : (
            <div className="icon-box"><IconSvg name={p.icon} /></div>
          )}
          <span className="admin-pcard-tag">{catLabel[p.cat]}</span>
          <span className={`pub-badge ${isPublished ? "pub-yes" : "pub-no"}`}>
            {isPublished ? "منشور" : "غير منشور"}
          </span>
        </div>
        <div className="admin-pcard-body">
          <h4>{p.name}</h4>
          <span>{p.price} ج.م{p.images && p.images.length > 1 ? ` · ${p.images.length} صور` : ""}</span>
          {(p.colors?.length > 0 || p.sizes?.length > 0) && (
            <div className="admin-pcard-variants">
              {p.colors?.length > 0 && <span>{p.colors.length} ألوان</span>}
              {p.sizes?.length > 0 && <span>{p.sizes.length} مقاسات</span>}
            </div>
          )}
        </div>
        <div className="admin-pcard-actions">
          <button className="edit-btn" onClick={() => startEdit(p)}>تعديل</button>
          <button className="pub-btn" onClick={() => handleTogglePublish(p)}>
            {isPublished ? "إخفاء" : "نشر"}
          </button>
          <button className="del-btn" onClick={() => handleDelete(p.id)}>حذف</button>
        </div>
      </div>
    );
  }

  const publishedList = products.filter((p) => p.published !== false);
  const unpublishedList = products.filter((p) => p.published === false);

  return (
    <div className="admin-wrap">
      <div className="section-head" style={{ margin: "0 0 12px", padding: 0 }} ref={formTopRef}>
        <h2>{editingId ? "تعديل منتج" : "إضافة منتج جديد"}</h2>
        {editingId && (
          <button type="button" className="del-btn" onClick={cancelEdit}>إلغاء التعديل</button>
        )}
      </div>
      <div className="admin-banner">
        هذه الصفحة محمية بكلمة سر (Basic Auth) على مستوى الخادم. لا تشارك رابط أو كلمة سر لوحة التحكم مع أحد لا تثق فيه.
      </div>
      <form onSubmit={handleSubmit}>
        <div className="admin-grid">
          <div className="field"><label>اسم المنتج</label><input required name="name" value={form.name} onChange={handleChange} /></div>
          <div className="field"><label>السعر (ج.م)</label><input required type="number" min="1" name="price" value={form.price} onChange={handleChange} /></div>
          <div className="field">
            <label>القسم</label>
            <select className="admin-select" name="cat" value={form.cat} onChange={handleChange}>
              <option value="men">رجالي</option>
              <option value="women">نسائي</option>
            </select>
          </div>
          <div className="field">
            <label>الأيقونة (تظهر لو مفيش صور)</label>
            <select className="admin-select" name="icon" value={form.icon} onChange={handleChange}>
              {Object.keys(icons).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label>الوصف</label><textarea rows={2} name="desc" value={form.desc} onChange={handleChange} /></div>

        <div className="admin-grid">
          <div className="field">
            <label>الألوان المتاحة (اختياري — افصل بينهم بفاصلة)</label>
            <input name="colors" value={form.colors} onChange={handleChange} placeholder="أحمر, أسود, أزرق" />
          </div>
          <div className="field">
            <label>المقاسات المتاحة (اختياري — افصل بينهم بفاصلة)</label>
            <input name="sizes" value={form.sizes} onChange={handleChange} placeholder="S, M, L, XL" />
          </div>
        </div>

        <div className="field">
          <label>صور المنتج (أول صورة بتبقى الرئيسية — تقدر تختار أكتر من صورة مرة واحدة)</label>
          <input type="file" accept="image/*" multiple onChange={handleFilesSelected} disabled={uploading} />
          {uploading && <div className="note-box" style={{ marginTop: 10 }}>جارِ رفع الصور...</div>}
          {images.length > 0 && (
            <div className="upload-preview">
              {images.map((src, i) => (
                <div className="upload-thumb" key={i}>
                  <img src={src} alt="" />
                  <button type="button" onClick={() => removeImage(i)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={uploading}>
          {editingId ? "حفظ التعديلات" : "إضافة المنتج"}
        </button>
      </form>

      <div className="section-head" style={{ margin: "40px 0 16px", padding: 0, alignItems: "center" }}>
        <h2 style={{ fontSize: "20px" }}>منشور ({publishedList.length})</h2>
        <span style={{ fontSize: "12.5px" }}>ظاهر للعملاء الآن — اسحب لإعادة الترتيب</span>
      </div>
      <div className="admin-product-grid">
        {publishedList.length === 0 ? (
          <div className="note-box">لا يوجد منتجات منشورة حاليًا.</div>
        ) : (
          publishedList.map((p) => renderCard(p, true))
        )}
      </div>

      <div className="section-head" style={{ margin: "40px 0 16px", padding: 0, alignItems: "center" }}>
        <h2 style={{ fontSize: "20px" }}>غير منشور ({unpublishedList.length})</h2>
        <span style={{ fontSize: "12.5px" }}>مخفي عن العملاء</span>
      </div>
      <div className="admin-product-grid">
        {unpublishedList.length === 0 ? (
          <div className="note-box">لا يوجد منتجات غير منشورة.</div>
        ) : (
          unpublishedList.map((p) => renderCard(p, false))
        )}
      </div>
    </div>
  );
}
