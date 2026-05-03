import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "纸片人男友 — Love.ai",
  description: "你的专属 AI 虚拟男友，随时陪伴在身边",
};

export const viewport: Viewport = {
  themeColor: "#08080f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col grain"
        style={{
          fontFamily: "var(--font-body), 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
          background: "#08080f",
          color: "#f0ebe3",
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
