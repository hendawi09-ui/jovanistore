import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const VALID_STATUSES = ["pending", "confirmed", "shipped", "delivered", "returned", "cancelled"];

export async function PATCH(req, { params }) {
  const body = await req.json();
  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
  }

  const update = { status: body.status };

  // أول ما الطلب يتسلّم بنسجّل تاريخ الاستلام — منه بتتحسب مدة الاسترجاع (14 يوم).
  // لو الطلب كان اتسلّم قبل كده، بنسيب التاريخ الأصلي زي ما هو.
  if (body.status === "delivered") {
    const { data: current } = await supabase
      .from("orders")
      .select("delivered_at")
      .eq("id", params.id)
      .maybeSingle();
    if (!current?.delivered_at) update.delivered_at = new Date().toISOString();
  }

  const { error } = await supabase.from("orders").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
