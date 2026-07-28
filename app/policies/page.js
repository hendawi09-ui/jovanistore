import { contact, shipping, policy } from "@/lib/siteConfig";

export const metadata = {
  title: "التواصل والسياسات | Jovani Store",
  description: "تواصل معنا وتعرّف على سياسة الشحن والاستبدال والإرجاع والخصوصية في متجر Jovani Store.",
};

export default function PoliciesPage() {
  return (
    <div className="policy-wrap">
      <h1 className="policy-title">التواصل والسياسات</h1>

      {/* التواصل */}
      <section className="policy-section" id="contact">
        <h2>تواصل معنا</h2>
        <p>
          فريقنا جاهز للرد على أي استفسار عن المقاسات أو الخامات أو حالة طلبك. نرد عادةً {contact.hours}.
        </p>
        <div className="contact-cards">
          <a
            className="contact-card wa"
            href={`https://wa.me/${contact.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.95L2 22l5.2-1.5A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 1 1-4.1 15.06l-.3-.18-3.1.9.9-3-.2-.3A8.1 8.1 0 0 1 12.04 3.8Zm4.7 10.28c-.25-.13-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12s-.64.8-.79.97c-.14.16-.29.18-.54.06a6.63 6.63 0 0 1-3.3-2.88c-.25-.43.25-.4.71-1.33.08-.16.04-.3-.02-.42-.06-.13-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.42.06-.64.3-.22.25-.85.83-.85 2.02s.87 2.34 1 2.5c.12.17 1.71 2.61 4.15 3.66 1.55.67 2.15.72 2.92.61.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z" />
            </svg>
            <div>
              <strong>واتساب</strong>
              <span>اضغط للمحادثة الفورية</span>
            </div>
          </a>

          <a
            className="contact-card ig"
            href={`https://instagram.com/${contact.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
            <div>
              <strong>إنستجرام</strong>
              <span>@{contact.instagram}</span>
            </div>
          </a>
        </div>
      </section>

      {/* الشحن */}
      <section className="policy-section" id="shipping">
        <h2>سياسة الشحن</h2>
        <p>
          نشحن لجميع محافظات مصر. مدة التوصيل المتوقعة {shipping.deliveryDays} من تأكيد الطلب،
          وقد تزيد قليلًا في المناطق النائية أو أيام العطلات الرسمية.
        </p>
        <div className="shipping-table-wrap">
          <table className="shipping-table">
            <thead>
              <tr>
                <th>المنطقة</th>
                <th>رسوم الشحن</th>
              </tr>
            </thead>
            <tbody>
              {shipping.rates.map((r) => (
                <tr key={r.zone}>
                  <td>{r.zone}</td>
                  <td className="ship-price">{r.price} ج.م</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="policy-list">
          <li>يتم التواصل معك هاتفيًا لتأكيد الطلب قبل الشحن.</li>
          <li>يُرجى التأكد من صحة رقم الهاتف والعنوان لتفادي تأخير التوصيل.</li>
          <li>في حالة تعذّر الوصول إليك مرتين، يُعاد الطلب إلينا وقد تُطبّق رسوم الشحن.</li>
        </ul>
      </section>

      {/* الاستبدال والإرجاع */}
      <section className="policy-section" id="returns">
        <h2>سياسة الاستبدال والإرجاع</h2>
        <p>
          يحق لك استبدال أو إرجاع أي منتج خلال <strong>{policy.returnDays} يومًا</strong> من تاريخ الاستلام،
          بشرط أن يكون بحالته الأصلية.
        </p>

        <h3>شروط القبول</h3>
        <ul className="policy-list">
          <li>المنتج لم يُستخدم ولم يُغسل ولم تُزل منه أي بطاقات (تيكيت).</li>
          <li>المنتج بحالته وتغليفه الأصلي.</li>
          <li>وجود إثبات الشراء (رقم الطلب أو فاتورة).</li>
        </ul>

        <h3>حالات لا تقبل الإرجاع</h3>
        <ul className="policy-list">
          <li>المنتجات المخفّضة ضمن التصفية النهائية (إن وُجدت).</li>
          <li>المنتجات المتضررة نتيجة سوء الاستخدام أو الغسيل الخاطئ.</li>
        </ul>

        <h3>خطوات الإرجاع</h3>
        <ol className="policy-list">
          <li>راسلنا على واتساب مع رقم الطلب وسبب الإرجاع.</li>
          <li>نرتّب لك موعد استلام المنتج من عنوانك.</li>
          <li>بعد فحص المنتج والتأكد من الشروط، نتمّ الاستبدال أو نردّ المبلغ.</li>
        </ol>

        <div className="policy-note">
          <strong>ملاحظة:</strong> في حالة الإرجاع لتغيير الرأي، يتحمّل العميل رسوم الشحن.
          أما إذا كان المنتج به عيب مصنعي أو وصلك خطأ، فنتحمّل نحن كل التكاليف ونعتذر لك عن الإزعاج.
        </div>

        <h3>ردّ المبلغ</h3>
        <p>
          للطلبات المدفوعة عند الاستلام، يُردّ المبلغ نقدًا أو عبر محفظة إلكترونية خلال 3 إلى 7 أيام عمل
          من استلامنا للمنتج وقبوله.
        </p>
      </section>

      {/* الخصوصية */}
      <section className="policy-section" id="privacy">
        <h2>سياسة الخصوصية</h2>
        <p>
          نجمع فقط البيانات اللازمة لتنفيذ طلبك: الاسم، رقم الهاتف، والعنوان.
        </p>
        <ul className="policy-list">
          <li>لا نبيع بياناتك أو نشاركها مع أي جهة خارجية لأغراض تسويقية.</li>
          <li>تُستخدم بياناتك حصريًا في تجهيز الطلب وشحنه والتواصل معك بشأنه.</li>
          <li>تُشارك بيانات العنوان مع شركة الشحن فقط بالقدر اللازم للتوصيل.</li>
          <li>يمكنك طلب حذف بياناتك في أي وقت بمراسلتنا على واتساب.</li>
        </ul>
      </section>

      <p className="policy-updated">آخر تحديث: يوليو 2026</p>
    </div>
  );
}
