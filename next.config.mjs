/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // بنسمح لـ Next.js يحسّن الصور اللي متخزنة في Supabase Storage.
    // النتيجة: بيبعت الصورة بصيغة أحدث وأصغر (WebP/AVIF) وبمقاس مناسب لكل شاشة.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // المقاسات اللي الموقع بيحتاجها فعلًا — بطاقات المنتجات وصور السلايدر
    deviceSizes: [360, 480, 640, 828, 1080, 1300, 1920, 2600],
    imageSizes: [64, 128, 160, 230, 320],
  },
};

export default nextConfig;
