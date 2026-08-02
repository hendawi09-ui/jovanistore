import { NextResponse } from "next/server";
import { createSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/adminSession";
import { checkLocked, recordFailure, recordSuccess } from "@/lib/adminAttempts";

const ADMIN_USER = "admin";

function getClientIp(req) {
  // Vercel بيبعت الـ IP الحقيقي في الهيدر ده
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}

export async function POST(req) {
  const ip = getClientIp(req);

  const locked = await checkLocked(ip);
  if (locked.locked) {
    return NextResponse.json(
      { error: `محاولات كتير غلط. حاول تاني بعد ${locked.minutesLeft} دقيقة.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const user = String(body.username || "").trim().toLowerCase();
  const pass = String(body.password || "");
  const expected = process.env.ADMIN_PASSWORD;

  const userOk = user === ADMIN_USER;
  const passOk = !!expected && (pass === expected || pass.trim() === expected);

  if (!userOk || !passOk) {
    const result = await recordFailure(ip);
    const msg = result.locked
      ? `محاولات كتير غلط. اتقفل الدخول 15 دقيقة.`
      : `اسم المستخدم أو كلمة السر غلط. باقيلك ${result.attemptsLeft} محاولات.`;
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  await recordSuccess(ip);

  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  const token = await createSessionToken(secret, 12);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 ساعة
  });
  return res;
}
