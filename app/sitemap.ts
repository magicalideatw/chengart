import type { MetadataRoute } from "next";
import { getPublicCourseIds } from "@/lib/courses/queries";
import { getEventSlugs } from "@/lib/events/queries";
import { siteConfig } from "@/lib/data/site";
import { pageSeo } from "@/lib/seo/pages";

export const dynamic = "force-dynamic";

const STATIC_PAGES = [
  { path: pageSeo.home.path, priority: 1, changeFrequency: "weekly" as const },
  { path: pageSeo.courses.path, priority: 0.9, changeFrequency: "weekly" as const },
  {
    path: pageSeo.performances.path,
    priority: 0.9,
    changeFrequency: "weekly" as const,
  },
  { path: pageSeo.events.path, priority: 0.8, changeFrequency: "weekly" as const },
  { path: pageSeo.about.path, priority: 0.8, changeFrequency: "monthly" as const },
  { path: pageSeo.news.path, priority: 0.7, changeFrequency: "weekly" as const },
  { path: pageSeo.contact.path, priority: 0.7, changeFrequency: "monthly" as const },
  { path: pageSeo.space.path, priority: 0.9, changeFrequency: "weekly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courseIds, eventSlugs] = await Promise.all([
    getPublicCourseIds(),
    getEventSlugs(),
  ]);

  const now = new Date();

  return [
    ...STATIC_PAGES.map((page) => ({
      url: new URL(page.path, siteConfig.url).toString(),
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
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
