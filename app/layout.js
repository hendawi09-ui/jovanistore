import "./globals.css";
import { StoreProvider } from "@/lib/StoreContext";
import ClientShell from "@/components/ClientShell";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "Jovani Store | ملابس رجالية ونسائية",
  description: "متجر ملابس جاهزة رجالية ونسائية في مصر",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <StoreProvider>
          <ClientShell>{children}</ClientShell>
        </StoreProvider>
        <Analytics />
      </body>
    </html>
  );
}
