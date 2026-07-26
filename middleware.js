import { NextResponse } from "next/server";

const REALM = "Jovani Admin";
const ADMIN_USER = "admin";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Reading the product list must stay public (used by the storefront itself).
  if (pathname.startsWith("/api/products") && req.method === "GET") {
    return NextResponse.next();
  }

  // إنشاء طلب جديد وعرض الطلبات لازم يفضلوا عموميين (يستخدمهم العميل من صفحة الدفع وطلباتي)
  if (pathname.startsWith("/api/orders") && (req.method === "GET" || req.method === "POST")) {
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
        if (user === ADMIN_USER && pass === process.env.ADMIN_PASSWORD) {
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
  matcher: ["/admin/:path*", "/api/products/:path*", "/api/upload/:path*", "/api/orders/:path*"],
};


