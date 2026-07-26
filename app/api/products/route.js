import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

function toClient(row) {
  const images =
    Array.isArray(row.image_urls) && row.image_urls.length > 0
      ? row.image_urls.filter(Boolean)
      : row.image_url
      ? [row.image_url]
      : [];
  return {
    id: row.id,
    cat: row.cat,
    icon: row.icon,
    name: row.name,
    desc: row.description,
    price: Number(row.price),
    images,
    image: images[0] || null, // توافق مع أي كود قديم بيستخدم صورة واحدة
  };
}

export async function GET() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map(toClient));
}

export async function POST(req) {
  const body = await req.json();
  const images = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        cat: body.cat,
        icon: body.icon,
        name: body.name,
        description: body.desc,
        price: body.price,
        image_urls: images.length > 0 ? images : null,
        image_url: images[0] || null,
      },
    ])
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toClient(data[0]));
}
