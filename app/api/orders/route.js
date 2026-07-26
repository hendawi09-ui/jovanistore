import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { notifyNewOrder } from "@/lib/notify";

export async function GET() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const order = await req.json();
  const { data, error } = await supabase.from("orders").insert([order]).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await notifyNewOrder(order);
  } catch (e) {
    console.error("notifyNewOrder failed:", e);
  }

  return NextResponse.json(data[0]);
}
