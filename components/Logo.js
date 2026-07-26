import Image from "next/image";

export default function Logo({ size = "normal" }) {
  const compact = size === "compact";
  const h = compact ? 44 : 72;
  const w = Math.round(h * (1120 / 890)); // keep the logo's real aspect ratio

  return (
    <Image
      src="/logo.png"
      alt="JOVANI Casual Wear"
      width={w}
      height={h}
      priority
      style={{ height: h, width: "auto" }}
    />
  );
}
