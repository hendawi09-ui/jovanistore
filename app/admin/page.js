"use client";
import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/StoreContext";
import { IconSvg, icons } from "@/lib/icons";
import { catCssVar, catLabel, parseSize, stockKey, getTotalStock, hasDiscount, discountPercent, matchesQuery } from "@/lib/products";
import { showToast } from "@/components/Toast";

const emptyForm = { name: "", price: "", salePrice: "", cat: "men", icon: "shirt", desc: "", groupKey: "", colorName: "", sizes: "" };

export default function AdminPage() {
  const { products, addProduct, updateProduct, deleteProduct, togglePublish, reorderProducts } = useStore();
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]); // uploaded image URLs for the product being added/edited
  const [stock, setStock] = useState({}); // { "لون|مقاس": عدد }
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = وضع إضافة، غير null = وضع تعديل
  const formTopRef = useRef(null);
  const autoFilledGroup = useRef(null); // آخر كود مجموعة اتنسخت بياناته
  const [groupNotice, setGroupNotice] = useState("");

  const dragId = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | published | unpublished

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  // لما تكتب كود مجموعة موجود بالفعل (وانت بتضيف منتج جديد)،
  // بننسخ البيانات المشتركة من أول منتج في المجموعة ونسيب الخانات الخاصة باللون فاضية.
  useEffect(() => {
    if (editingId) return; // في وضع التعديل منعملش نسخ
    const key = form.groupKey.trim();

    if (!key) {
      autoFilledGroup.current = null;
      setGroupNotice("");
      return;
    }
    if (autoFilledGroup.current === key) return; // اتنسخت قبل كده، منكتبش فوق تعديلاتك

    const sibling = products.find((p) => (p.groupKey || "").trim() === key);
    if (!sibling) {
      autoFilledGroup.current = null;
      setGroupNotice("");
      return;
    }

    autoFilledGroup.current = key;
    setForm((f) => ({
      ...f,
      name: sibling.name || "",
      cat: sibling.cat || "men",
      icon: sibling.icon || "shirt",
      desc: sibling.desc || "",
      sizes: (sibling.sizes || []).map((x) => parseSize(x).name).join(", "),
    }));
    setGroupNotice(
      `تم نسخ الاسم والقسم والوصف والمقاسات من «${sibling.name}»${
        sibling.colorName ? ` (${sibling.colorName})` : ""
      } — عدّل أي خانة زي ما تحب.`
    );
  }, [form.groupKey, editingId, products]);

  // قوائم الألوان والمقاسات الحالية من الحقول النصية (تستخدم لبناء جدول المخزون)
  const colorNames = form.colorName.trim() ? [form.colorName.trim()] : [];
  const sizeNames = form.sizes.split(",").map((s) => s.trim()).filter(Boolean).map((s) => parseSize(s).name);
  const stockRows = colorNames.length > 0 ? colorNames : [""];
  const stockCols = sizeNames.length > 0 ? sizeNames : [""];

  function buildStockPayload(colorNameRaw, sizesRaw) {
    const cNames = colorNameRaw ? [colorNameRaw] : [];
    const sNames = sizesRaw.map((s) => parseSize(s).name);
    const rows = cNames.length > 0 ? cNames : [""];
    const cols = sNames.length > 0 ? sNames : [""];
    const out = {};
    for (const c of rows) {
      for (const s of cols) {
        const k = stockKey(c, s);
        out[k] = Number(stock[k]) || 0;
      }
    }
    return out;
  }

  function setStockValue(c, s, value) {
    const k = stockKey(c, s);
    setStock((prev) => ({ ...prev, [k]: value === "" ? "" : Math.max(0, Number(value) || 0) }));
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
      salePrice: p.salePrice ? String(p.salePrice) : "",
      cat: p.cat || "men",
      icon: p.icon || "shirt",
      desc: p.desc || "",
      groupKey: p.groupKey || "",
      colorName: p.colorName || "",
      sizes: (p.sizes || []).join(", "),
    });
    setImages(p.images || []);
    setGroupNotice("");
    autoFilledGroup.current = null;
    setStock(p.stock && typeof p.stock === "object" ? p.stock : {});
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setImages([]);
    setGroupNotice("");
    autoFilledGroup.current = null;
    setStock({});
  }

  function handleSubmit(e) {
    e.preventDefault();
    const sizes = form.sizes.split(",").map((s) => s.trim()).filter(Boolean);
    const payload = {
      cat: form.cat,
      icon: form.icon,
      name: form.name,
      desc: form.desc || "منتج جديد من Jovani Store.",
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      images,
      sizes,
      groupKey: form.groupKey.trim() || null,
      colorName: form.colorName.trim() || null,
      stock: buildStockPayload(form.colorName.trim(), sizes),
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
    setStock({});
    setGroupNotice("");
    autoFilledGroup.current = null;
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

  // نقل المنتج لأول الترتيب داخل مجموعته (منشور أو غير منشور)
  async function moveToTop(id) {
    const target = products.find((x) => x.id === id);
    if (!target) return;
    const group = target.published !== false;

    // أول منتج في نفس المجموعة هو المكان اللي هننقل له
    const firstInGroup = products.find((x) => (x.published !== false) === group);
    if (!firstInGroup || firstInGroup.id === id) return;

    const ids = products.map((x) => x.id);
    const insertAt = ids.indexOf(firstInGroup.id);
    const from = ids.indexOf(id);
    if (from === -1 || insertAt === -1) return;

    ids.splice(from, 1);
    ids.splice(insertAt, 0, id);

    setReordering(true);
    const ok = await reorderProducts(ids);
    setReordering(false);
    showToast(ok ? "تم نقله لأول الترتيب" : "حدث خطأ أثناء النقل");
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
        <div className="admin-pcard-top">
          <button
            className="top-btn"
            onClick={() => moveToTop(p.id)}
            title="نقل لأول الترتيب"
            aria-label="نقل لأول الترتيب"
          >
            ▲
          </button>
          <span className="admin-pcard-handle" title="اسحب لإعادة الترتيب">⠿⠿</span>
        </div>
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
          <span>
            {hasDiscount(p) ? (
              <>
                <s style={{ color: "var(--muted)" }}>{p.price}</s>{" "}
                <strong style={{ color: "var(--red)" }}>{p.salePrice} ج.م</strong>
                <span className="disc-chip">-{discountPercent(p)}%</span>
              </>
            ) : (
              `${p.price} ج.م`
            )}
            {p.images && p.images.length > 1 ? ` · ${p.images.length} صور` : ""}
          </span>
          {(p.colorName || p.sizes?.length > 0) && (
            <div className="admin-pcard-variants">
              {p.colorName && <span>{p.colorName}</span>}
              {p.sizes?.length > 0 && <span>{p.sizes.length} مقاسات</span>}
            </div>
          )}
          {getTotalStock(p) !== null && (
            <div className="admin-pcard-variants">
              <span className={getTotalStock(p) === 0 ? "stock-zero" : ""}>
                {getTotalStock(p) === 0 ? "نفدت الكمية" : `المخزون: ${getTotalStock(p)}`}
              </span>
            </div>
          )}
          {p.groupKey && (
            <button
              className="group-chip"
              title="اضغط لنسخ كود المجموعة"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard?.writeText(p.groupKey).then(
                  () => showToast(`تم نسخ الكود: ${p.groupKey}`),
                  () => showToast("تعذّر النسخ")
                );
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
              {p.groupKey}
            </button>
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

  // بحث في الاسم، الوصف، اسم اللون، كود المجموعة، والمقاسات
  const q = query.trim();
  function matches(p) {
    if (!q) return true;
    const hay = [p.name, p.desc, p.colorName, p.groupKey, ...(p.sizes || [])]
      .filter(Boolean)
      .join(" ");
    return matchesQuery(hay, q);
  }

  const publishedList = products.filter((p) => p.published !== false && matches(p));
  const unpublishedList = products.filter((p) => p.published === false && matches(p));
  const showPublished = filter === "all" || filter === "published";
  const showUnpublished = filter === "all" || filter === "unpublished";

  return (
    <div className="admin-wrap">
      <div className="admin-tabs">
        <span className="admin-tab active">المنتجات</span>
        <a href="/admin/orders" className="admin-tab">طلبات الشراء</a>
        <a href="/admin/coupons" className="admin-tab">كوبونات الخصم</a>
      </div>
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
          <div className="field"><label>السعر الأصلي (ج.م)</label><input required type="number" min="1" name="price" value={form.price} onChange={handleChange} /></div>
          <div className="field">
            <label>السعر بعد الخصم (اختياري)</label>
            <input type="number" min="1" name="salePrice" value={form.salePrice} onChange={handleChange} placeholder="اتركه فارغًا لو مفيش خصم" />
          </div>
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
            <label>اسم اللون (لون هذا المنتج تحديدًا)</label>
            <input name="colorName" value={form.colorName} onChange={handleChange} placeholder="مثال: كحلي" />
          </div>
          <div className="field">
            <label>كود مجموعة الألوان (نفس الكود لكل ألوان نفس القطعة)</label>
            <input name="groupKey" value={form.groupKey} onChange={handleChange} placeholder="مثال: dress-winter-01" />
            {groupNotice && <div className="group-notice">{groupNotice}</div>}
          </div>
          <div className="field">
            <label>المقاسات المتاحة (افصل بفاصلة)</label>
            <input name="sizes" value={form.sizes} onChange={handleChange} placeholder="S, M, L, XL" />
          </div>
        </div>

        <div className="field">
          <label>الكميات المتاحة (تنقص تلقائيًا مع كل طلب)</label>
          <div>
            <div className="stock-table-wrap">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>اللون / المقاس</th>
                    {stockCols.map((s) => <th key={s}>{s || "—"}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {stockRows.map((c) => (
                    <tr key={c}>
                      <th>{c || "—"}</th>
                      {stockCols.map((s) => (
                        <td key={s}>
                          <input
                            type="number"
                            min="0"
                            value={stock[stockKey(c, s)] ?? ""}
                            onChange={(e) => setStockValue(c, s, e.target.value)}
                            placeholder="0"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="note-box" style={{ marginTop: 10 }}>
                اكتب اسم اللون والمقاسات فوق الأول، وبعدين املأ الكمية المتاحة لكل مقاس. المقاس اللي كميته صفر هيظهر مشطوب للعملاء تلقائيًا.
              </div>
            </div>
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

      <div className="admin-search">
        <div className="admin-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو الوصف أو اللون أو كود المجموعة..."
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery("")} aria-label="مسح">✕</button>
          )}
        </div>
        <div className="admin-filter">
          {[
            { k: "all", label: "الكل" },
            { k: "published", label: "منشور" },
            { k: "unpublished", label: "غير منشور" },
          ].map((f) => (
            <button
              key={f.k}
              className={`filter-tab ${filter === f.k ? "active" : ""}`}
              onClick={() => setFilter(f.k)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {showPublished && (
      <>
      <div className="section-head" style={{ margin: "28px 0 16px", padding: 0, alignItems: "center" }}>
        <h2 style={{ fontSize: "20px" }}>منشور ({publishedList.length})</h2>
        <span style={{ fontSize: "12.5px" }}>ظاهر للعملاء الآن — اسحب لإعادة الترتيب</span>
      </div>
      <div className="admin-product-grid">
        {publishedList.length === 0 ? (
          <div className="note-box">{q ? "لا توجد نتائج مطابقة للبحث." : "لا يوجد منتجات منشورة حاليًا."}</div>
        ) : (
          publishedList.map((p) => renderCard(p, true))
        )}
      </div>

      </>
      )}

      {showUnpublished && (
      <>
      <div className="section-head" style={{ margin: "40px 0 16px", padding: 0, alignItems: "center" }}>
        <h2 style={{ fontSize: "20px" }}>غير منشور ({unpublishedList.length})</h2>
        <span style={{ fontSize: "12.5px" }}>مخفي عن العملاء</span>
      </div>
      <div className="admin-product-grid">
        {unpublishedList.length === 0 ? (
          <div className="note-box">{q ? "لا توجد نتائج مطابقة للبحث." : "لا يوجد منتجات غير منشورة."}</div>
        ) : (
          unpublishedList.map((p) => renderCard(p, false))
        )}
      </div>
      </>
      )}
    </div>
  );
}
