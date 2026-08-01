// بيصغّر الصورة في المتصفح قبل ما ترفع للسيرفر.
// الفايدة: الموقع بيبقى أسرع للزباين، والرفع نفسه بيبقى أسرع كمان.
// مفيش أي مكتبة خارجية — بنستخدم إمكانيات المتصفح نفسه.

const MAX_WIDTH = 1200;   // أقصى عرض بالبكسل
const MAX_HEIGHT = 1600;  // أقصى ارتفاع بالبكسل (نسبة 3:4 زي عرض الموقع)
const QUALITY = 0.82;     // جودة JPEG — 0.82 توازن ممتاز بين الجودة والحجم

export async function compressImage(file) {
  // الصور المتحركة (GIF) والـ SVG بنسيبها زي ما هي عشان متتلفش
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);

    let { width, height } = bitmap;
    const scale = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height, 1);
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // خلفية بيضا عشان الصور الشفافة (PNG) متطلعش سودا بعد التحويل لـ JPEG
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    );

    // لو الضغط فشل أو طلع أكبر من الأصل، نرفع الأصل
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    // أي مشكلة → نرفع الملف الأصلي عادي بدل ما نوقف الرفع
    return file;
  }
}

// بيرجّع نص جاهز للعرض زي: "3.8 ميجا ← 340 كيلو"
export function compressionLabel(before, after) {
  const fmt = (b) =>
    b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} ميجا` : `${Math.round(b / 1024)} كيلو`;
  if (after >= before) return null;
  return `${fmt(before)} ← ${fmt(after)}`;
}
