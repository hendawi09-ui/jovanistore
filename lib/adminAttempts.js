import { supabase } from "@/lib/supabaseClient";

const MAX_ATTEMPTS = 10;
const LOCK_MINUTES = 15;

// بيرجع { locked: true, minutesLeft } لو الـ IP مقفول، أو { locked: false }
export async function checkLocked(ip) {
  const { data } = await supabase
    .from("admin_login_attempts")
    .select("locked_until")
    .eq("ip", ip)
    .maybeSingle();

  if (data?.locked_until && new Date(data.locked_until) > new Date()) {
    const minutesLeft = Math.ceil((new Date(data.locked_until) - new Date()) / 60000);
    return { locked: true, minutesLeft };
  }
  return { locked: false };
}

// بيسجّل محاولة غلط، ولو وصلت لحد أقصى بيقفل الـ IP لمدة LOCK_MINUTES
export async function recordFailure(ip) {
  const { data } = await supabase
    .from("admin_login_attempts")
    .select("attempts")
    .eq("ip", ip)
    .maybeSingle();

  const attempts = (data?.attempts || 0) + 1;
  const locked_until =
    attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString() : null;

  await supabase.from("admin_login_attempts").upsert({
    ip,
    attempts: locked_until ? 0 : attempts, // بعد القفل بنصفّر العداد عشان يبدأ من جديد بعد ما ينفتح
    locked_until,
    updated_at: new Date().toISOString(),
  });

  return {
    locked: !!locked_until,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts),
  };
}

// بيمسح سجل المحاولات بعد تسجيل دخول ناجح
export async function recordSuccess(ip) {
  await supabase.from("admin_login_attempts").delete().eq("ip", ip);
}
