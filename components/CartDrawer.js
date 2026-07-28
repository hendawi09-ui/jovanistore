"use client";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/StoreContext";
import { IconSvg } from "@/lib/icons";
import { catCssVar, effectivePrice, hasDiscount } from "@/lib/products";

export default function CartDrawer({ open, onClose }) {
  const { cart, products, cartTotal, changeQty, removeItem } = useStore();
  const router = useRouter();
  const entries = Object.entries(cart).filter(([, e]) => products.some((p) => p.id == e.id));

  return (
    <>
      <div className={`overlay ${open ? "show" : ""}`} onClick={onClose} />
      <aside className={`drawer ${open ? "show" : ""}`}>
        <div className="drawer-head">
          <h3>سلة المشتريات</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-items">
          {entries.length === 0 ? (
            <div className="cart-empty">سلتك فارغة حاليًا<br />ابدأ التسوّق واختر ما يعجبك</div>
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
                    <div className="qty-ctrl">
                      <button onClick={() => changeQty(key, -1)}>−</button>
                      <span>{entry.qty}</span>
                      <button onClick={() => changeQty(key, 1)}>+</button>
                    </div>
                    <button className="rm-btn" onClick={() => removeItem(key)}>إزالة</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="drawer-foot">
          <div className="drawer-total"><span>الإجمالي</span><span>{cartTotal} ج.م</span></div>
          <button
            className="checkout-btn"
            onClick={() => { onClose(); router.push("/checkout"); }}
          >
            إتمام الطلب
          </button>
        </div>
      </aside>
    </>
  );
}
