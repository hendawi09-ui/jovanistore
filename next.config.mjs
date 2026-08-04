/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // بنسمح بتحسين الصور من أي نطاق آمن (https) — عشان الصور القديمة اللي
    // اتضافت من مصادر بره Supabase تفضل شغالة زي ما هي.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // المقاسات اللي الموقع بيحتاجها فعلًا — بطاقات المنتجات وصور السلايدر
    deviceSizes: [360, 480, 640, 828, 1080, 1300, 1920, 2600],
    imageSizes: [64, 128, 160, 230, 320],
  },
};

export default nextConfig;
