"use client";
import { useStore } from "@/lib/StoreContext";
import { IconSvg } from "@/lib/icons";
import { catCssVar, effectivePrice, hasDiscount } from "@/lib/products";
import { showToast } from "./Toast";

export default function FavoritesDrawer({ open, onClose }) {
  const { favorites, products, removeFavorite, moveToCart } = useStore();
  const entries = Object.entries(favorites).filter(([, e]) => products.some((p) => p.id == e.id));

  return (
    <>
      <div className={`overlay ${open ? "show" : ""}`} onClick={onClose} />
      <aside className={`drawer ${open ? "show" : ""}`}>
        <div className="drawer-head">
          <h3>المفضلة</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-items">
          {entries.length === 0 ? (
            <div className="cart-empty">
              قائمة المفضلة فارغة
              <br />
              اضغط على ♡ في أي منتج لحفظه هنا
            </div>
          ) : (
            entries.map(([key, entry]) => {
              const p = products.find((x) => x.id == entry.id);
              const variantLabel = [entry.color, entry.size].filter(Boolean).join(" · ");
              return (
                <div className="cart-item" key={key}>
                  {p.images && p.images[0] ? (
                    <img src={p.images[0]} alt="" className="cart-item-img" />
                  ) : (
                    <div className="icon-box" style={{ "--c": `var(${catCssVar[p.cat]})` }}>
                      <IconSvg name={p.icon} />
                    </div>
                  )}
                  <div className="cart-item-info">
                    <h4>{p.name}</h4>
                    {variantLabel && <div className="cvariant">{variantLabel}</div>}
                    <div className="cprice">
                      {hasDiscount(p) ? (
                        <>
                          <span className="price-sale">{p.salePrice} ج.م</span> <s className="price-old">{p.price}</s>
                        </>
                      ) : (
                        `${p.price} ج.م`
                      )}
                    </div>
                    <div className="item-actions">
                      <button
                        className="move-btn"
                        onClick={() => {
                          moveToCart(key);
                          showToast("تم نقله إلى السلة ✓");
                        }}
                      >
                        نقل إلى السلة
                      </button>
                      <button className="rm-btn" onClick={() => removeFavorite(key)}>إزالة</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="drawer-foot">
          <div className="drawer-total">
            <span>عدد المنتجات</span>
            <span>{entries.length}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
