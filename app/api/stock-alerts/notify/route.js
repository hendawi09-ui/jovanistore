import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

// محمي — بيبعت للزبون إيميل إن المنتج رجع يتوفر
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  const { data: row, error } = await supabase
    .from("stock_alerts")
    .select("*")
    .eq("id", body.id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }
  if (!row.email) {
    return NextResponse.json({ error: "الزبون ما سابش إيميل — استخدم الواتساب" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "خدمة الإيميل مش مظبوطة" }, { status: 500 });
  }

  const details = [row.color, row.size].filter(Boolean).join(" · ");
  const link = `https://www.jovani-store.com/product/${row.product_id}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Jovani Store <noreply@jovani-store.com>",
      to: [row.email],
      subject: `${row.product_name || "المنتج"} رجع متوفر ✨`,
      html: `
        <div dir="rtl" style="font-family:sans-serif; line-height:1.9; color:#0D0D0D;">
          <h2 style="color:#E31B23;">خبر حلو — المنتج رجع متوفر!</h2>
          <p>كنت سجّلت عندنا عشان نعرّفك أول ما يتوفر، وأهو رجع:</p>
          <p style="font-size:17px;"><b>${row.product_name || "المنتج"}</b>${details ? `<br><span style="color:#6E6B80;">${details}</span>` : ""}</p>
          <p style="margin:26px 0;">
            <a href="${link}" style="background:#0D0D0D; color:#fff; padding:13px 30px; border-radius:999px; text-decoration:none; font-weight:bold;">
              اطلبه دلوقتي
            </a>
          </p>
          <p style="color:#6E6B80; font-size:13px;">
            الكميات محدودة — يُفضّل تطلب بسرعة قبل ما تخلص تاني.
          </p>
          <hr style="border:none; border-top:1px solid #E7E4E7; margin:22px 0;">
          <p style="color:#6E6B80; font-size:12px;">Jovani Store</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return NextResponse.json({ error: `فشل إرسال الإيميل: ${t.slice(0, 120)}` }, { status: 500 });
  }

  await supabase
    .from("stock_alerts")
    .update({ notified: true, notified_at: new Date().toISOString() })
    .eq("id", row.id);

  return NextResponse.json({ ok: true });
}
