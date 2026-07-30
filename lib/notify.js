function buildOrderSummary(order) {
  const items = (order.items || []).map((i) => `${i.name} × ${i.qty}`).join("، ");
  return { items };
}

async function sendEmail(order) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!apiKey || !to) return;

  const { items } = buildOrderSummary(order);
  const payMethod = order.pay === "cod" ? "الدفع عند الاستلام" : "بطاقة (تجريبي)";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Jovani Store <noreply@jovani-store.com>",
      to: [to],
      subject: `طلب جديد #${order.id} — ${order.total} ج.م`,
      html: `
        <div dir="rtl" style="font-family:sans-serif; line-height:1.8;">
          <h2>طلب جديد على Jovani Store</h2>
          <p><b>رقم الطلب:</b> ${order.id}</p>
          <p><b>الاسم:</b> ${order.name || "-"}</p>
          <p><b>الموبايل:</b> ${order.phone || "-"}</p>
          <p><b>المحافظة/المدينة:</b> ${order.city || "-"}</p>
          <p><b>العنوان:</b> ${order.address || "-"}</p>
          <p><b>المنتجات:</b> ${items}</p>
          <p><b>الشحن:</b> ${order.shipping || 0} ج.م</p>
          <p><b>الإجمالي:</b> ${order.total} ج.م</p>
          <p><b>طريقة الدفع:</b> ${payMethod}</p>
        </div>
      `,
    }),
  });
}

async function sendWhatsApp(order) {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return;

  const { items } = buildOrderSummary(order);
  const payMethod = order.pay === "cod" ? "عند الاستلام" : "بطاقة";
  const text =
    `طلب جديد #${order.id}\n` +
    `الاسم: ${order.name || "-"}\n` +
    `موبايل: ${order.phone || "-"}\n` +
    `المدينة: ${order.city || "-"}\n` +
    `المنتجات: ${items}\n` +
    `الشحن: ${order.shipping || 0} ج.م\n` +
    `الإجمالي: ${order.total} ج.م\n` +
    `الدفع: ${payMethod}`;

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
    phone
  )}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;

  await fetch(url);
}

export async function notifyNewOrder(order) {
  const results = await Promise.allSettled([sendEmail(order), sendWhatsApp(order)]);
  results.forEach((r) => {
    if (r.status === "rejected") console.error("notify error:", r.reason);
  });
}

// إشعار عند إلغاء العميل لطلبه
export async function notifyCancelledOrder(order) {
  const { items } = buildOrderSummary(order);

  const tasks = [];

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (apiKey && to) {
    tasks.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Jovani Store <noreply@jovani-store.com>",
          to: [to],
          subject: `إلغاء طلب #${order.id}`,
          html: `
            <div dir="rtl" style="font-family:sans-serif; line-height:1.8;">
              <h2>العميل ألغى طلبه</h2>
              <p><b>رقم الطلب:</b> ${order.id}</p>
              <p><b>الاسم:</b> ${order.name || "-"}</p>
              <p><b>الموبايل:</b> ${order.phone || "-"}</p>
              <p><b>المنتجات:</b> ${items}</p>
              <p><b>الإجمالي:</b> ${order.total} ج.م</p>
              <p>تم إرجاع الكميات للمخزون تلقائيًا.</p>
            </div>
          `,
        }),
      })
    );
  }

  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (phone && apikey) {
    const text =
      `❌ إلغاء طلب #${order.id}\n` +
      `الاسم: ${order.name || "-"}\n` +
      `موبايل: ${order.phone || "-"}\n` +
      `المنتجات: ${items}\n` +
      `الإجمالي: ${order.total} ج.م\n` +
      `رجعت الكميات للمخزون`;
    tasks.push(
      fetch(
        `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`
      )
    );
  }

  const results = await Promise.allSettled(tasks);
  results.forEach((r) => {
    if (r.status === "rejected") console.error("notifyCancelled error:", r.reason);
  });
}

// إرسال رابط إعادة تعيين كلمة السر للعميل
export async function sendPasswordResetEmail(email, resetUrl, name) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !email) return { ok: false };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Jovani Store <noreply@jovani-store.com>",
      to: [email],
      subject: "إعادة تعيين كلمة السر — Jovani Store",
      html: `
        <div dir="rtl" style="font-family:sans-serif; line-height:1.9; color:#0D0D0D; max-width:520px; margin:0 auto; padding:24px;">
          <h2 style="color:#E31B23;">Jovani Store</h2>
          <p>أهلًا ${name || ""},</p>
          <p>وصلنا طلب لإعادة تعيين كلمة السر بتاعة حسابك.</p>
          <p style="margin:26px 0;">
            <a href="${resetUrl}"
               style="background:#E31B23; color:#fff; text-decoration:none; font-weight:bold;
                      padding:14px 30px; border-radius:10px; display:inline-block;">
              تعيين كلمة سر جديدة
            </a>
          </p>
          <p style="font-size:13px; color:#6E6B80;">
            الرابط ده صالح لمدة ساعة واحدة بس.<br>
            لو مش انت اللي طلبت ده، تجاهل الرسالة وكلمة سرك هتفضل زي ما هي.
          </p>
          <hr style="border:none; border-top:1px solid #E7E4E7; margin:24px 0;">
          <p style="font-size:12px; color:#6E6B80;">رسالة تلقائية من متجر Jovani Store</p>
        </div>
      `,
    }),
  });

  return { ok: res.ok };
}
