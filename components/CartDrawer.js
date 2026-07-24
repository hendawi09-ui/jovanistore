"use client";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/StoreContext";
import { IconSvg } from "@/lib/icons";
import { catCssVar } from "@/lib/products";

export default function CartDrawer({ open, onClose }) {
  const { cart, products, cartTotal, changeQty, removeItem } = useStore();
  const router = useRouter();
  const ids = Object.keys(cart).filter((id) => products.some((p) => p.id == id));

  return (
    <>
      <div className={`overlay ${open ? "show" : ""}`} onClick={onClose} />
      <aside className={`drawer ${open ? "show" : ""}`}>
        <div className="drawer-head">
          <h3>سلة المشتريات</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-items">
          {ids.length === 0 ? (
            <div className="cart-empty">سلتك فارغة حاليًا<br />ابدأ التسوّق واختر ما يعجبك</div>
          ) : (
            ids.map((id) => {
              const p = products.find((x) => x.id == id);
              return (
                <div className="cart-item" key={id}>
                  <div className="icon-box" style={{ "--c": `var(${catCssVar[p.cat]})` }}>
                    <IconSvg name={p.icon} />
                  </div>
                  <div className="cart-item-info">
                    <h4>{p.name}</h4>
                    <div className="cprice">{p.price} ج.م</div>
                    <div className="qty-ctrl">
                      <button onClick={() => changeQty(p.id, -1)}>−</button>
                      <span>{cart[id]}</span>
                      <button onClick={() => changeQty(p.id, 1)}>+</button>
                    </div>
                    <button className="rm-btn" onClick={() => removeItem(p.id)}>إزالة</button>
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
