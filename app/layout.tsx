import type { Metadata } from "next";
import { Noto_Sans_TC, Outfit } from "next/font/google";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/data/site";
import {
  getDefaultOgImageUrl,
  SEO_DEFAULT_OG_IMAGE,
} from "@/lib/seo/constants";
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
    "魔術表演",
    "戲劇",
    "舞蹈",
    "藝術教育",
    "桃園藝文",
    "中壢魔術",
    "兒童藝術課程",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "晟心誠藝劇團｜魔術 × 戲劇 × 舞蹈｜演出與藝術教育",
    description: siteConfig.description,
    images: [
      {
        url: getDefaultOgImageUrl(),
        width: SEO_DEFAULT_OG_IMAGE.width,
        height: SEO_DEFAULT_OG_IMAGE.height,
        alt: SEO_DEFAULT_OG_IMAGE.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "晟心誠藝劇團｜魔術 × 戲劇 × 舞蹈｜演出與藝術教育",
    description: siteConfig.description,
    images: [getDefaultOgImageUrl()],
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
