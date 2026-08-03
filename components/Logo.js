import Image from "next/image";

// نسبة أبعاد اللوجو الجديد (عرض/ارتفاع) — عشان العرض يتحسب تلقائيًا وميتشوهش
const LOGO_RATIO = 1829 / 1487;

export default function Logo({ size = "normal" }) {
  const compact = size === "compact";
  const h = compact ? 44 : 64; // ارتفاع اللوجو
  const w = Math.round(h * LOGO_RATIO);

  return (
    <Image
      src="/logo.png"
      alt="JOVANI store"
      width={w}
      height={h}
      priority
      style={{ width: w, height: h, objectFit: "contain", flexShrink: 0 }}
    />
  );
}
