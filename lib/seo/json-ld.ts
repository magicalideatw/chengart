import { spaceRentalContent } from "@/lib/data/space-rental";
import { siteConfig } from "@/lib/data/site";
import type { CourseWithEnrollment } from "@/lib/courses/types";
import type { EventPageData } from "@/lib/events/types";
import { getEffectivePricePerStudent } from "@/lib/registration/pricing";
import { getDefaultOgImageUrl } from "@/lib/seo/constants";
import { toIsoDateTime, truncateDescription } from "@/lib/seo/format";
import { homeSectionSeo } from "@/lib/seo/pages";
import type { ClassSession } from "@/lib/sessions/types";
import type { TicketTypeRecord } from "@/lib/ticket-types/types";

const organizationAddress = {
  "@type": "PostalAddress" as const,
  streetAddress: spaceRentalContent.location.address,
  addressLocality: "中壢區",
  addressRegion: "桃園市",
  addressCountry: "TW",
};

function buildPlace(locationName?: string) {
  return {
    "@type": "Place" as const,
    name: locationName?.trim() || spaceRentalContent.hero.subtitle,
    address: organizationAddress,
  };
}

function buildOffer(price: number, pageUrl: string, available: boolean) {
  return {
    "@type": "Offer" as const,
    price,
    priceCurrency: "TWD",
    availability: available
      ? "https://schema.org/InStock"
      : "https://schema.org/SoldOut",
    url: pageUrl,
  };
}

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
      "@id": new URL(section.path, siteConfig.url).toString(),
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
  const { hero, location, usageItems } = spaceRentalContent;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: hero.subtitle,
    description: hero.description,
    url: `${siteConfig.url}/space`,
    image: new URL("/images/space/hero.jpg", siteConfig.url).toString(),
    email: siteConfig.email,
    address: organizationAddress,
    areaServed: {
      "@type": "AdministrativeArea",
      name: "桃園市",
    },
    knowsAbout: usageItems.map((item) => item.title),
    parentOrganization: {
      "@id": `${siteConfig.url}/#organization`,
    },
  };
}

type CourseJsonLdInput = {
  course: CourseWithEnrollment;
  pageUrl: string;
  sessions?: ClassSession[];
};

export function buildCourseJsonLd({
  course,
  pageUrl,
  sessions = [],
}: CourseJsonLdInput) {
  const price = getEffectivePricePerStudent(course);
  const available = course.isOpen && !course.isFull;
  const openSessions = sessions.filter((session) => session.isOpen);

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: truncateDescription(course.description, 300),
    url: pageUrl,
    provider: {
      "@id": `${siteConfig.url}/#organization`,
    },
    offers: buildOffer(price, pageUrl, available),
    ...(openSessions.length > 0
      ? {
          hasCourseInstance: openSessions.map((session) => ({
            "@type": "CourseInstance",
            name: session.name,
            courseMode: "https://schema.org/OfflineAttendance",
            startDate: toIsoDateTime(session.date, session.startTime),
            endDate: toIsoDateTime(session.date, session.endTime),
            location: session.location?.trim()
              ? {
                  "@type": "Place",
                  name: session.location,
                  address: organizationAddress,
                }
              : buildPlace(),
            offers: buildOffer(
              session.price > 0 ? session.price : price,
              pageUrl,
              available && session.remainingCapacity > 0,
            ),
          })),
        }
      : {
          location: buildPlace(),
        }),
  };
}

type PerformanceEventJsonLdInput = {
  course: CourseWithEnrollment;
  pageUrl: string;
  imageUrl: string;
  sessions?: ClassSession[];
  ticketTypes?: TicketTypeRecord[];
};

function buildSessionSubEvent(
  course: CourseWithEnrollment,
  pageUrl: string,
  session: ClassSession,
  imageUrl: string,
) {
  const available =
    course.isOpen && session.isOpen && session.remainingCapacity > 0;

  return {
    "@type": "Event",
    name: session.name || course.title,
    description: truncateDescription(course.description, 300),
    url: pageUrl,
    image: imageUrl,
    startDate: toIsoDateTime(session.date, session.startTime),
    endDate: toIsoDateTime(session.date, session.endTime),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: available
      ? "https://schema.org/EventScheduled"
      : "https://schema.org/EventCancelled",
    location: session.location?.trim()
      ? {
          "@type": "Place",
          name: session.location,
          address: organizationAddress,
        }
      : buildPlace(siteConfig.name),
    organizer: {
      "@id": `${siteConfig.url}/#organization`,
    },
    offers: buildOffer(
      session.price > 0 ? session.price : getEffectivePricePerStudent(course),
      pageUrl,
      available,
    ),
  };
}

export function buildPerformanceEventJsonLd({
  course,
  pageUrl,
  imageUrl,
  sessions = [],
  ticketTypes = [],
}: PerformanceEventJsonLdInput) {
  const openSessions = sessions.filter((session) => session.isOpen);
  const available = course.isOpen && !course.isFull;
  const ticketOffers = ticketTypes
    .filter((ticket) => ticket.isActive)
    .map((ticket) => buildOffer(ticket.price, pageUrl, available));

  if (openSessions.length > 1) {
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      name: course.title,
      description: truncateDescription(course.description, 300),
      url: pageUrl,
      image: imageUrl,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: available
        ? "https://schema.org/EventScheduled"
        : "https://schema.org/EventCancelled",
      organizer: {
        "@id": `${siteConfig.url}/#organization`,
      },
      subEvent: openSessions.map((session) =>
        buildSessionSubEvent(course, pageUrl, session, imageUrl),
      ),
      ...(ticketOffers.length > 0 ? { offers: ticketOffers } : {}),
    };
  }

  if (openSessions.length === 1) {
    return {
      "@context": "https://schema.org",
      ...buildSessionSubEvent(course, pageUrl, openSessions[0], imageUrl),
      name: course.title,
      ...(ticketOffers.length > 0 ? { offers: ticketOffers } : {}),
    };
  }

  const sessionTime = course.sessionTime?.split(/[-–—]/)[0]?.trim();

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: course.title,
    description: truncateDescription(course.description, 300),
    url: pageUrl,
    image: imageUrl,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: available
      ? "https://schema.org/EventScheduled"
      : "https://schema.org/EventCancelled",
    organizer: {
      "@id": `${siteConfig.url}/#organization`,
    },
    location: buildPlace(siteConfig.name),
    ...(course.sessionDate
      ? { startDate: toIsoDateTime(course.sessionDate, sessionTime) }
      : {}),
    offers:
      ticketOffers.length > 0
        ? ticketOffers
        : buildOffer(getEffectivePricePerStudent(course), pageUrl, available),
  };
}

export function buildMarketingEventJsonLd(
  event: EventPageData,
  pageUrl: string,
  imageUrl?: string,
) {
  const description = truncateDescription(
    event.subtitle || event.intro || event.content,
    300,
  );

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description,
    url: pageUrl,
    ...(imageUrl ? { image: imageUrl } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus:
      event.status === "已結束"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    organizer: {
      "@id": `${siteConfig.url}/#organization`,
    },
    ...(event.startDate
      ? { startDate: toIsoDateTime(event.startDate, event.time) }
      : {}),
    ...(event.endDate
      ? { endDate: toIsoDateTime(event.endDate, event.time) }
      : {}),
    ...(event.location
      ? {
          location: {
            "@type": "Place",
            name: event.location,
            address: organizationAddress,
          },
        }
      : {
          location: buildPlace(siteConfig.name),
        }),
    ...(event.registrationUrl
      ? {
          offers: {
            "@type": "Offer",
            url: event.registrationUrl,
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}
