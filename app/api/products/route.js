import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

function toClient(row) {
  return {
    id: row.id,
    cat: row.cat,
    icon: row.icon,
    name: row.name,
    desc: row.description,
    price: Number(row.price),
    image: row.image_url || null,
  };
}

export async function GET() {
  const { data, error } = await supabase.from("products").select("*").order("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map(toClient));
}

export async function POST(req) {
  const body = await req.json();
  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        cat: body.cat,
        icon: body.icon,
        name: body.name,
        description: body.desc,
        price: body.price,
        image_url: body.image || null,
      },
    ])
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toClient(data[0]));
}
