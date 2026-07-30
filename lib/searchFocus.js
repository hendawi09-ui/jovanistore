// بيحط المؤشر جوه حقل البحث في الصفحة الرئيسية ويفتح الكيبورد على الموبايل.
// مهم: التركيز لازم يحصل فورًا مع الضغطة نفسها، لأن متصفحات الموبايل
// بترفض تفتح الكيبورد لو التركيز اتأخر عن لحظة الضغط.
export function focusSearchInput() {
  const input = document.getElementById("site-search-input");
  if (!input) return false;
  input.focus({ preventScroll: true });
  input.scrollIntoView({ behavior: "smooth", block: "center" });
  return true;
}

// بيتعامل مع الضغط على أي زرار بحث: لو الحقل في الصفحة الحالية بيركّز عليه فورًا،
// وإلا بينقل للرئيسية ويحاول لحد ما الحقل يظهر.
export function handleSearchNav(e, router) {
  e.preventDefault();
  if (focusSearchInput()) return;

  router.push("/");
  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    if (focusSearchInput() || tries > 20) clearInterval(timer);
  }, 100);
}
