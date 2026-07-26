import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const VALID_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export async function PATCH(req, { params }) {
  const body = await req.json();
  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
  }
  const { error } = await supabase.from("orders").update({ status: body.status }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
