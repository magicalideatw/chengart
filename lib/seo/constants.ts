import { siteConfig } from "@/lib/data/site";

export const SEO_DEFAULT_OG_IMAGE = {
  path: "/images/hero-performance.jpg",
  width: 1200,
  height: 630,
  alt: "晟心誠藝劇團劇場演出",
} as const;

export function getDefaultOgImageUrl(): string {
  return new URL(SEO_DEFAULT_OG_IMAGE.path, siteConfig.url).toString();
}
