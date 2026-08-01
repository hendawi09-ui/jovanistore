import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { policy } from "@/lib/siteConfig";
import { notifyReturnRequest } from "@/lib/notify";

const KINDS = ["return", "exchange"];

// محمي — لوحة التحكم بتجيب كل الطلبات
export async function GET() {
  const { data, error } = await supabase
    .from("return_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// عام — العميل بيقدّم طلب استرجاع أو استبدال
export async function POST(req) {
  const body = await req.json();
  const orderId = String(body.orderId || "").trim();
  const phone = String(body.phone || "").replace(/\D/g, "");

  if (!orderId || !phone) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }
  if (!KINDS.includes(body.kind)) {
    return NextResponse.json({ error: "نوع الطلب غير صالح" }, { status: 400 });
  }

  // بنتأكد إن الطلب فعلًا بتاع صاحب الرقم ده — عشان محدش يقدّم طلب على طلب مش بتاعه
  const { data: order, error: oErr } = await supabase
    .from("orders")
    .select("id, name, phone, status, delivered_at, created_at")
    .eq("id", orderId)
    .maybeSingle();

  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  const orderPhone = String(order.phone || "").replace(/\D/g, "");
  if (orderPhone !== phone) {
    return NextResponse.json({ error: "الطلب ده مش مسجّل على رقمك" }, { status: 403 });
  }

  // لازم يكون متسلّم
  if (order.status !== "delivered") {
    return NextResponse.json({ error: "الطلب لسه ماتسلّمش" }, { status: 400 });
  }

  // لازم يكون لسه في مدة الاسترجاع
  const base = order.delivered_at || order.created_at;
  const days = Math.floor((Date.now() - new Date(base).getTime()) / 86400000);
  if (days > policy.returnDays) {
    return NextResponse.json(
      { error: `مدة الاسترجاع (${policy.returnDays} يوم) انتهت` },
      { status: 400 }
    );
  }

  // منع تقديم طلب تاني على نفس القطعة (مهما كانت حالته).
  // القطع التانية في نفس الأوردر لسه متاحة عادي.
  const itemName = String(body.itemName || "").slice(0, 300);
  const { data: existing } = await supabase
    .from("return_requests")
    .select("id")
    .eq("order_id", orderId)
    .eq("item_name", itemName);
  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "فيه طلب مقدّم على القطعة دي بالفعل" },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("return_requests").insert([
    {
      order_id: orderId,
      customer_name: order.name || "",
      customer_phone: orderPhone,
      kind: body.kind,
      item_name: itemName,
      item_qty: Math.max(1, Number(body.itemQty) || 1),
      wanted_size: body.kind === "exchange" ? String(body.wantedSize || "").slice(0, 60) : null,
      wanted_color: body.kind === "exchange" ? String(body.wantedColor || "").slice(0, 60) : null,
      reason: String(body.reason || "").slice(0, 200),
      note: String(body.note || "").slice(0, 1000),
      status: "new",
    },
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // إشعار واتساب وإيميل — لو فشل مش بيأثر على الطلب نفسه
  notifyReturnRequest({
    orderId,
    name: order.name,
    phone: orderPhone,
    kind: body.kind,
    itemName,
    itemQty: Math.max(1, Number(body.itemQty) || 1),
    wantedSize: body.wantedSize,
    wantedColor: body.wantedColor,
    reason: body.reason,
    note: body.note,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
