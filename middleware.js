import { NextResponse } from "next/server";

const REALM = "Jovani Admin";
const ADMIN_USER = "admin";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Reading the product list must stay public (used by the storefront itself).
  if (pathname.startsWith("/api/products") && req.method === "GET") {
    return NextResponse.next();
  }

  // التحقق من كود الخصم لازم يفضل عمومي (العميل بيستخدمه من صفحة الدفع)
  if (pathname.startsWith("/api/coupons/validate")) {
    return NextResponse.next();
  }

  // العميل يقدر ينشئ طلب جديد، ويشوف طلباته هو فقط عبر /api/orders/mine
  // أما عرض كل الطلبات (GET) فمحصور على لوحة التحكم لحماية بيانات العملاء
  if (pathname.startsWith("/api/orders/mine") && req.method === "POST") {
    return NextResponse.next();
  }
  // إلغاء الطلب من العميل — محمي برقم الموبايل داخل المسار نفسه
  if (/^\/api\/orders\/[^/]+\/cancel$/.test(pathname) && req.method === "POST") {
    return NextResponse.next();
  }
  if (pathname === "/api/orders" && req.method === "POST") {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      try {
        const decoded = atob(encoded);
        const idx = decoded.indexOf(":");
        const user = decoded.slice(0, idx);
        const pass = decoded.slice(idx + 1);

        // كيبورد الموبايل بيكبّر أول حرف تلقائيًا وأحيانًا بيضيف مسافة،
        // فبنتجاهل حالة الحروف والمسافات الزيادة في اسم المستخدم،
        // وبنقبل كلمة السر بمسافات زيادة كمان (مع الأصلية بالظبط).
        const userOk = user.trim().toLowerCase() === ADMIN_USER.toLowerCase();
        const expected = process.env.ADMIN_PASSWORD;
        const passOk = pass === expected || pass.trim() === expected;

        if (userOk && passOk) {
          return NextResponse.next();
        }
      } catch {
        // fall through to 401 below
      }
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}"` },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/products/:path*", "/api/upload/:path*", "/api/orders/:path*", "/api/coupons/:path*"],
};


