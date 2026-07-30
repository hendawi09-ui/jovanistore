import crypto from "crypto";

// تشفير كلمة السر بملح عشوائي (scrypt) — بدون أي مكتبة خارجية، مبني في Node نفسه
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// مقارنة كلمة السر المُدخلة بالنسخة المشفّرة المحفوظة
export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string" || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  try {
    const hashBuffer = Buffer.from(hash, "hex");
    const suppliedBuffer = crypto.scryptSync(String(password), salt, 64);
    if (hashBuffer.length !== suppliedBuffer.length) return false;
    return crypto.timingSafeEqual(hashBuffer, suppliedBuffer);
  } catch {
    return false;
  }
}
