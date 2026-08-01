"use client";
import { contact } from "@/lib/siteConfig";

// بيفتح نافذة طباعة فيها بوليصة الشحن جاهزة للقص واللصق على الشنطة.
// مقاس البوليصة 10×15 سم (مقاس الاستيكر المعتاد لشركات الشحن).
export function printShippingLabel(order) {
  const items = (order.items || [])
    .map((it) => `<tr><td>${escapeHtml(it.name)}</td><td class="c">${it.qty}</td></tr>`)
    .join("");

  const cod = order.pay === "cod";
  const wa = contact.whatsapp ? `واتساب: ${contact.whatsapp}` : "";
  const ig = contact.instagram ? `انستجرام: @${contact.instagram}` : "";

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>بوليصة شحن — طلب ${order.id}</title>
<style>
  @page { size: 100mm 150mm; margin: 0; }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:"Segoe UI","Tahoma",sans-serif;background:#fff;color:#000;}
  .label{width:100mm;height:150mm;padding:5mm;display:flex;flex-direction:column;border:1px solid #000;}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:3mm;}
  .brand{font-size:16pt;font-weight:900;letter-spacing:-.5px;}
  .brand span{color:#E31B23;}
  .oid{text-align:left;font-size:9pt;line-height:1.5;}
  .oid b{font-size:13pt;display:block;}
  .sec{padding:3mm 0;border-bottom:1px dashed #999;}
  .sec-t{font-size:7.5pt;font-weight:700;color:#555;margin-bottom:1.5mm;letter-spacing:.5px;}
  .name{font-size:13pt;font-weight:800;}
  .phone{font-size:14pt;font-weight:900;direction:ltr;text-align:right;margin-top:1mm;letter-spacing:1px;}
  .addr{font-size:10pt;line-height:1.6;margin-top:1mm;}
  .gov{display:inline-block;background:#000;color:#fff;font-size:10pt;font-weight:800;padding:1mm 3mm;border-radius:2mm;margin-top:1.5mm;}
  table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-top:1mm;}
  td{padding:1mm 0;border-bottom:1px solid #eee;}
  td.c{width:12mm;text-align:center;font-weight:700;}
  .pay{margin-top:auto;border:2.5px solid #000;padding:3mm;text-align:center;}
  .pay-t{font-size:8.5pt;font-weight:700;margin-bottom:1mm;}
  .pay-v{font-size:22pt;font-weight:900;line-height:1;}
  .paid{font-size:13pt;font-weight:900;}
  .foot{margin-top:2.5mm;font-size:7pt;color:#666;text-align:center;line-height:1.6;}
  @media print{ body{-webkit-print-color-adjust:exact;print-color-adjust:exact;} }
</style></head>
<body>
<div class="label">
  <div class="top">
    <div class="brand">Jovani<span>.</span></div>
    <div class="oid">طلب رقم<b>#${order.id}</b>${formatDate(order.created_at)}</div>
  </div>

  <div class="sec">
    <div class="sec-t">المرسل إليه</div>
    <div class="name">${escapeHtml(order.name || "")}</div>
    <div class="phone">${escapeHtml(order.phone || "")}</div>
    <div class="addr">${escapeHtml(order.address || "")}</div>
    <div class="gov">${escapeHtml(order.city || "")}</div>
  </div>

  <div class="sec">
    <div class="sec-t">المحتويات (${(order.items || []).reduce((s, i) => s + Number(i.qty || 0), 0)} قطعة)</div>
    <table>${items}</table>
  </div>

  <div class="pay">
    ${cod
      ? `<div class="pay-t">مبلغ التحصيل عند الاستلام</div><div class="pay-v">${order.total} ج.م</div>`
      : `<div class="pay-t">الطلب مدفوع مسبقًا</div><div class="paid">لا يُحصّل أي مبلغ</div>`}
  </div>

  <div class="foot">Jovani Store · ${wa} ${wa && ig ? "·" : ""} ${ig}</div>
</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

  const w = window.open("", "_blank", "width=460,height=680");
  if (!w) {
    alert("المتصفح منع فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة لهذا الموقع وحاول تاني.");
    return;
  }
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" });
}
