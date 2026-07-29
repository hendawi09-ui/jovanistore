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
      from: "Jovani Store <onboarding@resend.dev>",
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
          from: "Jovani Store <onboarding@resend.dev>",
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
