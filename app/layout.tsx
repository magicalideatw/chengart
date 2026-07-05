import type { Metadata } from "next";
import { Noto_Sans_TC, Outfit } from "next/font/google";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/data/site";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | ${siteConfig.nameEn}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "晟心誠藝劇團",
    "Cheng Art Theatre",
    "魔術",
    "戲劇",
    "舞蹈",
    "藝術教育",
    "演出服務",
    "夏令營",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | ${siteConfig.nameEn}`,
    description: siteConfig.description,
    images: [
      {
        url: "https://images.unsplash.com/photo-1547036967-23d11aeea016?w=1200&h=630&fit=crop&q=80",
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | ${siteConfig.nameEn}`,
    description: siteConfig.description,
    images: [
      "https://images.unsplash.com/photo-1547036967-23d11aeea016?w=1200&h=630&fit=crop&q=80",
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${notoSansTC.variable} ${outfit.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <JsonLd />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
