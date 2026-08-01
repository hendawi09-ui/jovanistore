import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// عام — بيرجّع القطع اللي عليها طلب استرجاع/استبدال في أوردر معيّن،
// عشان العميل ميقدرش يقدّم طلب تاني على نفس القطعة.
// محمي بمطابقة رقم الموبايل مع الطلب نفسه.
export async function POST(req) {
  const body = await req.json();
  const orderId = String(body.orderId || "").trim();
  const phone = String(body.phone || "").replace(/\D/g, "");
  if (!orderId || !phone) return NextResponse.json([]);

  const { data: order } = await supabase
    .from("orders")
    .select("phone")
    .eq("id", orderId)
    .maybeSingle();

  const orderPhone = String(order?.phone || "").replace(/\D/g, "");
  if (!order || orderPhone !== phone) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("return_requests")
    .select("item_name, kind, status")
    .eq("order_id", orderId);

  if (error) return NextResponse.json([]);
  return NextResponse.json(data || []);
}
