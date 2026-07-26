import Image from "next/image";

export default function Logo({ size = "normal" }) {
  const compact = size === "compact";
  const badgeSize = compact ? 52 : 88; // قطر الإطار الدائري

  return (
    <span
      style={{
        width: badgeSize,
        height: badgeSize,
        borderRadius: "50%",
        background: "#fff",
        border: "2px solid #0D0D0D",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <Image
        src="/logo.png"
        alt="JOVANI Casual Wear"
        width={1040}
        height={1008}
        priority
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </span>
  );
}
