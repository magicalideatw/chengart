import { spaceRentalContent } from "@/lib/data/space-rental";
import { siteConfig } from "@/lib/data/site";
import { getDefaultOgImageUrl } from "@/lib/seo/constants";
import { homeSectionSeo } from "@/lib/seo/pages";
import type { CourseWithEnrollment } from "@/lib/courses/types";
import type { EventPageData } from "@/lib/events/types";

export function buildOrganizationJsonLd() {
  return {
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    alternateName: siteConfig.nameEn,
    url: siteConfig.url,
    logo: getDefaultOgImageUrl(),
    description: siteConfig.description,
    email: siteConfig.email,
    sameAs: [siteConfig.facebook, siteConfig.instagram],
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: {
      "@id": `${siteConfig.url}/#organization`,
    },
    inLanguage: "zh-TW",
    hasPart: homeSectionSeo.map((section) => ({
      "@type": "WebPage",
      "@id": `${siteConfig.url}/#${section.id}`,
      name: section.name,
      description: section.description,
      isPartOf: {
        "@id": `${siteConfig.url}/#website`,
      },
    })),
  };
}

export function buildSiteJsonLdGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [buildOrganizationJsonLd(), buildWebSiteJsonLd()],
  };
}

export function buildLocalBusinessJsonLd() {
  const { location, hero } = spaceRentalContent;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: hero.subtitle,
    description: hero.description,
    url: `${siteConfig.url}/space`,
    image: new URL("/images/space/hero.jpg", siteConfig.url).toString(),
    telephone: siteConfig.email,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: location.address,
      addressLocality: "中壢區",
      addressRegion: "桃園市",
      addressCountry: "TW",
    },
    parentOrganization: {
      "@id": `${siteConfig.url}/#organization`,
    },
  };
}

export function buildCourseJsonLd(
  course: CourseWithEnrollment,
  pageUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    url: pageUrl,
    provider: {
      "@id": `${siteConfig.url}/#organization`,
    },
    offers: {
      "@type": "Offer",
      price: course.fee,
      priceCurrency: "TWD",
      availability:
        course.isOpen && !course.isFull
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
      url: pageUrl,
    },
  };
}

export function buildPerformanceEventJsonLd(
  course: CourseWithEnrollment,
  pageUrl: string,
  imageUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: course.title,
    description: course.description,
    url: pageUrl,
    image: imageUrl,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: course.isOpen
      ? "https://schema.org/EventScheduled"
      : "https://schema.org/EventCancelled",
    organizer: {
      "@id": `${siteConfig.url}/#organization`,
    },
    location: {
      "@type": "Place",
      name: siteConfig.name,
      address: {
        "@type": "PostalAddress",
        addressCountry: "TW",
      },
    },
    ...(course.sessionDate
      ? {
          startDate: course.sessionDate,
        }
      : {}),
  };
}

export function buildMarketingEventJsonLd(
  event: EventPageData,
  pageUrl: string,
  imageUrl?: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.subtitle || event.intro,
    url: pageUrl,
    ...(imageUrl ? { image: imageUrl } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    organizer: {
      "@id": `${siteConfig.url}/#organization`,
    },
    ...(event.startDate ? { startDate: event.startDate } : {}),
    ...(event.endDate ? { endDate: event.endDate } : {}),
  };
}
