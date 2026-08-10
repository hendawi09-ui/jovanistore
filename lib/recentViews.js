// تتبّع المنتجات اللي الزائر بصّ عليها — متخزنة في متصفحه هو بس.
const KEY = "jv_recent";
const MAX = 10;

export function addRecent(id) {
  if (typeof window === "undefined" || !id) return;
  try {
    const list = readRecent().filter((x) => String(x) !== String(id));
    list.unshift(String(id));
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch { /* لو التخزين مقفول، بنتجاهل بهدوء */ }
}

export function readRecent() {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}
