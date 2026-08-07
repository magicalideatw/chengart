import type { Metadata } from "next";
import { siteConfig } from "@/lib/data/site";
import { getDefaultOgImageUrl, SEO_DEFAULT_OG_IMAGE } from "@/lib/seo/constants";

export type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  ogType?: "website" | "article";
  robots?: Metadata["robots"];
};

function buildCanonicalUrl(path: string): string {
  if (path === "/") {
    return siteConfig.url;
  }

  return new URL(path, siteConfig.url).toString();
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const canonical = buildCanonicalUrl(input.path);
  const image = input.image ?? getDefaultOgImageUrl();
  const imageAlt = input.imageAlt ?? SEO_DEFAULT_OG_IMAGE.alt;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: input.ogType ?? "website",
      locale: "zh_TW",
      url: canonical,
      siteName: siteConfig.name,
      title: input.title,
      description: input.description,
      images: [
        {
          url: image,
          width: SEO_DEFAULT_OG_IMAGE.width,
          height: SEO_DEFAULT_OG_IMAGE.height,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
    ...(input.robots ? { robots: input.robots } : {}),
  };
}

export function toAbsoluteUrl(value: string, siteUrl = siteConfig.url): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return new URL(value, siteUrl).toString();
}
