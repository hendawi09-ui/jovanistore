import { NextResponse } from "next/server";
import { verifySessionToken, ADMIN_SESSION_COOKIE } from "@/lib/adminSession";

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
  // تسجيل زيارة منتج — بينادى من صفحة المنتج نفسها للزوار العاديين
  if (/^\/api\/products\/[^/]+\/view$/.test(pathname) && method === "POST") return true;
  if (pathname.startsWith("/api/hero") && method === "GET") return true;
  // الأكثر مبيعًا — قراءة فقط، بيرجع أرقام مبيعات مجمّعة من غير أي بيانات عملاء
  if (pathname.startsWith("/api/best-sellers") && method === "GET") return true;
  // وضع عرض المتجر — القراءة عامة (الواجهة محتاجاها)، والتبديل محمي تحت
  if (pathname.startsWith("/api/store-mode") && method === "GET") return true;
  // تسجيل تنبيه التوفر — الزبون بيبعت رقمه، فالتسجيل عام والقراءة محمية
  if (pathname.startsWith("/api/stock-alerts") && method === "POST") return true;
  if (pathname.startsWith("/api/coupons/validate")) return true;
  if (pathname.startsWith("/api/orders/mine") && method === "POST") return true;
  // متابعة الطلب برقم الموبايل — محمي جوه المسار نفسه بالرقم
  if (pathname === "/api/orders/by-phone" && method === "POST") return true;
  if (/^\/api\/orders\/[^/]+\/cancel$/.test(pathname) && method === "POST") return true;
  if (pathname === "/api/orders" && method === "POST") return true;
  // تقديم طلب استرجاع/استبدال — محمي جوه المسار نفسه (بيتأكد إن الطلب على رقم العميل)
  if (pathname === "/api/returns" && method === "POST") return true;
  // قراءة القطع اللي عليها طلب بالفعل — محمي جوه المسار بمطابقة رقم العميل
  if (pathname === "/api/returns/mine" && method === "POST") return true;
  return false;
}

// المسارات اللي محتاجة كلمة سر الأدمن
function needsAdminAuth(pathname, method) {
  if (pathname === "/admin/login") return false; // صفحة الدخول نفسها لازم تفضل مفتوحة
  if (pathname.startsWith("/admin")) return true;
  const guarded =
    pathname.startsWith("/api/products") ||
    pathname.startsWith("/api/hero") ||
    pathname.startsWith("/api/upload") ||
    pathname.startsWith("/api/orders") ||
    pathname.startsWith("/api/coupons") ||
    pathname.startsWith("/api/inventory") ||
    pathname.startsWith("/api/store-mode") ||
    pathname.startsWith("/api/stock-alerts") ||
    pathname.startsWith("/api/returns");
  return guarded && !isPublicApi(pathname, method);
}

export async function middleware(req) {
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

  // ============ 2) حماية لوحة التحكم بجلسة تسجيل دخول حقيقية ============
  if (!needsAdminAuth(pathname, req.method)) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  const sessionCookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const valid = secret ? await verifySessionToken(sessionCookie, secret) : false;

  if (valid) {
    return NextResponse.next();
  }

  // صفحة أدمن عادية → نوجّهه لصفحة تسجيل الدخول
  if (pathname.startsWith("/admin")) {
    const loginUrl = new URL("/admin/login", origin);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // طلب API محمي (بينادى من كود لوحة التحكم نفسها) → رد برسالة واضحة بدل صفحة فاضية
  return NextResponse.json({ error: "الجلسة انتهت، سجّل دخولك تاني" }, { status: 401 });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf)$).*)",
  ],
};
