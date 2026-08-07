import type { MetadataRoute } from "next";
import { getPublicCourseIds } from "@/lib/courses/queries";
import { getEventSlugs } from "@/lib/events/queries";
import { siteConfig } from "@/lib/data/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courseIds, eventSlugs] = await Promise.all([
    getPublicCourseIds(),
    getEventSlugs(),
  ]);

  const now = new Date();

  return [
    {
      url: siteConfig.url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/space", siteConfig.url).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...courseIds.map((id) => ({
      url: new URL(`/courses/${id}`, siteConfig.url).toString(),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...eventSlugs.map((slug) => ({
      url: new URL(`/events/${slug}`, siteConfig.url).toString(),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
