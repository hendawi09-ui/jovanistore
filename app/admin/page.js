"use client";
import { useState } from "react";
import { useStore } from "@/lib/StoreContext";
import { IconSvg, icons } from "@/lib/icons";
import { catCssVar, catLabel } from "@/lib/products";
import { showToast } from "@/components/Toast";

export default function AdminPage() {
  const { products, addProduct, deleteProduct } = useStore();
  const [form, setForm] = useState({ name: "", price: "", cat: "men", icon: "shirt", desc: "", images: "" });

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const images = form.images
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    addProduct({
      cat: form.cat,
      icon: form.icon,
      name: form.name,
      desc: form.desc || "منتج جديد من Jovani Store.",
      price: Number(form.price),
      images,
    }).then((ok) => {
      showToast(ok ? "تمت إضافة المنتج" : "حدث خطأ أثناء الحفظ");
    });
    setForm({ name: "", price: "", cat: "men", icon: "shirt", desc: "", images: "" });
  }

  function handleDelete(id) {
    deleteProduct(id).then((ok) => {
      showToast(ok ? "تم حذف المنتج" : "حدث خطأ أثناء الحذف");
    });
  }

  return (
    <div className="admin-wrap">
      <div className="section-head" style={{ margin: "0 0 12px", padding: 0 }}><h2>لوحة تحكم المنتجات</h2></div>
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
            <label>الأيقونة</label>
            <select className="admin-select" name="icon" value={form.icon} onChange={handleChange}>
              {Object.keys(icons).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label>الوصف</label><textarea rows={2} name="desc" value={form.desc} onChange={handleChange} /></div>
        <div className="field">
          <label>روابط الصور (اختياري — حط كل رابط في سطر لوحده، أول رابط بيبقى الصورة الرئيسية)</label>
          <textarea
            rows={3}
            name="images"
            value={form.images}
            onChange={handleChange}
            placeholder={"https://example.com/1.jpg\nhttps://example.com/2.jpg"}
          />
        </div>
        <button type="submit" className="btn-primary">إضافة المنتج</button>
      </form>

      <div className="admin-list">
        {products.map((p) => (
          <div className="admin-row" key={p.id}>
            <div className="icon-box" style={{ "--c": `var(${catCssVar[p.cat]})`, overflow: "hidden" }}>
              {p.images && p.images[0] ? <img src={p.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <IconSvg name={p.icon} />}
            </div>
            <div className="ainfo">
              <h4>{p.name}</h4>
              <span>{catLabel[p.cat]} · {p.price} ج.م{p.images && p.images.length > 1 ? ` · ${p.images.length} صور` : ""}</span>
            </div>
            <button className="del-btn" onClick={() => handleDelete(p.id)}>حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}
