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
    salePrice: row.sale_price !== null && row.sale_price !== undefined ? Number(row.sale_price) : null,
    images,
    image: images[0] || null, // توافق مع أي كود قديم بيستخدم صورة واحدة
    colors: Array.isArray(row.colors) ? row.colors.filter(Boolean) : [],
    sizes: Array.isArray(row.sizes) ? row.sizes.filter(Boolean) : [],
    published: row.published !== false, // القيمة الافتراضية منشور، إلا لو اتحدد صراحة false
    groupKey: row.group_key || null,   // المنتجات اللي بنفس المفتاح = ألوان لنفس القطعة
    colorName: row.color_name || null, // اسم لون هذا المنتج
    stock: row.stock && typeof row.stock === "object" ? row.stock : null,
    views: typeof row.views === "number" ? row.views : 0,
    createdAt: row.created_at || null,
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
  const colors = Array.isArray(body.colors) ? body.colors.filter(Boolean) : [];
  const sizes = Array.isArray(body.sizes) ? body.sizes.filter(Boolean) : [];
  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        cat: body.cat,
        icon: body.icon,
        name: body.name,
        description: body.desc,
        price: body.price,
        sale_price: body.salePrice ? Number(body.salePrice) : null,
        image_urls: images.length > 0 ? images : null,
        image_url: images[0] || null,
        colors: colors.length > 0 ? colors : null,
        sizes: sizes.length > 0 ? sizes : null,
        stock: body.stock && typeof body.stock === "object" ? body.stock : null,
        group_key: body.groupKey ? String(body.groupKey).trim() : null,
        color_name: body.colorName ? String(body.colorName).trim() : null,
      },
    ])
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toClient(data[0]));
}
