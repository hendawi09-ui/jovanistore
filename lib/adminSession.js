// جلسة تسجيل دخول الأدمن — بديل الـ Basic Auth القديم.
// بنستخدم Web Crypto (متاحة في السيرفر وفي middleware في نفس الوقت) عشان نوقّع
// "تذكرة دخول" (توكن) بيحمل تاريخ انتهاء، ونتأكد إنه سليم ومامتلاعبش بيه.

const encoder = new TextEncoder();

async function getKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// بيرجع توكن جلسة صالح لمدة `hours` ساعة (12 ساعة افتراضيًا)
export async function createSessionToken(secret, hours = 12) {
  const expires = Date.now() + hours * 60 * 60 * 1000;
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(String(expires)));
  return `${expires}.${toHex(sig)}`;
}

// بيتحقق إن التوكن سليم ولسه ساري
export async function verifySessionToken(token, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [expiresStr, sigHex] = token.split(".");
  const expires = Number(expiresStr);
  if (!expires || Number.isNaN(expires) || Date.now() > expires) return false;

  const key = await getKey(secret);
  const expectedSig = await crypto.subtle.sign("HMAC", key, encoder.encode(expiresStr));
  const expectedHex = toHex(expectedSig);

  if (expectedHex.length !== sigHex.length) return false;
  // مقارنة بدون تسريب الوقت (زي timingSafeEqual لكن بطريقة تشتغل في كل مكان)
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ sigHex.charCodeAt(i);
  }
  return diff === 0;
}

export const ADMIN_SESSION_COOKIE = "jv_admin_session";
