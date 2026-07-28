import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// بيرجع طلبات العميل الحالي فقط — بناءً على أرقام الطلبات المحفوظة في متصفحه
export async function POST(req) {
  const body = await req.json();
  const ids = Array.isArray(body.ids) ? body.ids.filter((x) => typeof x === "string").slice(0, 100) : [];

  if (ids.length === 0) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
