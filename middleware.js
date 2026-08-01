import { NextResponse } from "next/server";

const REALM = "Jovani Admin";
const ADMIN_USER = "admin";

// وضع الصيانة — بيتحكم فيه متغيّر MAINTENANCE_MODE من Vercel
// القيمة "true" = الموقع مقفول على الزوار. أي قيمة تانية أو مش موجود = الموقع شغّال عادي.
const MAINTENANCE = process.env.MAINTENANCE_MODE === "true";
const PREVIEW_COOKIE = "jv_preview";

// كلمة سر منفصلة للمعاينة وقت الصيانة — مش كلمة سر الأدمن.
// خليها حروف وأرقام بس (من غير & # @ + مسافات) عشان تشتغل في الرابط.
// بتتحط في Vercel باسم PREVIEW_KEY. لو مش موجودة، الفتح المؤقت بيبقى متعطّل.
const PREVIEW_KEY = process.env.PREVIEW_KEY;

function maintenancePage() {
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Jovani Store — تحت الصيانة</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&family=IBM+Plex+Sans+Arabic:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
       background:#FCFBFF;color:#0D0D0D;font-family:'IBM Plex Sans Arabic',sans-serif;text-align:center}
  .box{max-width:440px}
  .logo{font-family:'Cairo';font-weight:900;font-size:30px;margin-bottom:22px}
  .logo span{color:#E31B23}
  h1{font-family:'Cairo';font-weight:700;font-size:22px;margin-bottom:12px}
  p{font-size:15px;color:#6E6B80;line-height:1.9}
  .dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#E31B23;margin-left:8px;
       animation:pulse 1.6s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
</style>
</head>
<body>
  <div class="box">
    <div class="logo">Jovani<span>.</span></div>
    <h1><span class="dot"></span>الموقع تحت الصيانة</h1>
    <p>بنجهّز حاجات جديدة للمتجر دلوقتي.<br>ارجعلنا كمان شوية — وهتلاقي كل حاجة أحلى.</p>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Retry-After": "3600",
    },
  });
}

// المسارات اللي لازم تفضل عمومية حتى وهي تحت /api
function isPublicApi(pathname, method) {
  if (pathname.startsWith("/api/products") && method === "GET") return true;
  if (pathname.startsWith("/api/hero") && method === "GET") return true;
  if (pathname.startsWith("/api/coupons/validate")) return true;
  if (pathname.startsWith("/api/orders/mine") && method === "POST") return true;
  if (/^\/api\/orders\/[^/]+\/cancel$/.test(pathname) && method === "POST") return true;
  if (pathname === "/api/orders" && method === "POST") return true;
  return false;
}

// المسارات اللي محتاجة كلمة سر الأدمن
function needsAdminAuth(pathname, method) {
  if (pathname.startsWith("/admin")) return true;
  const guarded =
    pathname.startsWith("/api/products") ||
    pathname.startsWith("/api/hero") ||
    pathname.startsWith("/api/upload") ||
    pathname.startsWith("/api/orders") ||
    pathname.startsWith("/api/coupons");
  return guarded && !isPublicApi(pathname, method);
}

export function middleware(req) {
  const { pathname, searchParams, origin } = req.nextUrl;

  // ============ 1) بوابة الصيانة (للزوار العاديين فقط) ============
  // لوحة التحكم والـ API بيفضلوا شغّالين عشان تقدر تكمّل شغلك عادي
  if (MAINTENANCE && !pathname.startsWith("/admin") && !pathname.startsWith("/api/")) {
    // رابط الفتح المؤقت: yoursite.com/?unlock=PREVIEW_KEY
    // بيحط كوكي في متصفحك عشان تتصفح الموقع كله عادي وانت شغّال
    const unlock = searchParams.get("unlock");
    if (PREVIEW_KEY && unlock === PREVIEW_KEY) {
      const res = NextResponse.redirect(new URL(pathname, origin));
      res.cookies.set(PREVIEW_COOKIE, PREVIEW_KEY, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 12,
      });
      return res;
    }

    const cookie = req.cookies.get(PREVIEW_COOKIE)?.value;
    if (!(PREVIEW_KEY && cookie === PREVIEW_KEY)) {
      return maintenancePage();
    }
  }

  // ============ 2) حماية لوحة التحكم (زي ما كانت بالظبط) ============
  if (!needsAdminAuth(pathname, req.method)) {
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf)$).*)",
  ],
};
