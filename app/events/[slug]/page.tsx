import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventPageContent } from "@/components/events/EventPageContent";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { getEventBySlug } from "@/lib/events/queries";
import { buildMarketingEventJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata, toAbsoluteUrl } from "@/lib/seo/metadata";
import { truncateDescription } from "@/lib/seo/format";
import { siteConfig } from "@/lib/data/site";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return { title: "活動不存在" };
  }

  const description = truncateDescription(
    event.subtitle ||
      event.intro ||
      `查看「${event.title}」最新消息、活動內容與報名資訊。`,
  );

  return buildPageMetadata({
    title: `${event.title}｜最新消息`,
    description,
    path: `/events/${event.slug}`,
    image: event.coverImage ? toAbsoluteUrl(event.coverImage) : undefined,
    imageAlt: `${event.title}活動封面`,
    ogType: "article",
  });
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const pageUrl = new URL(`/events/${event.slug}`, siteConfig.url).toString();
  const imageUrl = event.coverImage
    ? toAbsoluteUrl(event.coverImage)
    : undefined;

  return (
    <>
      <JsonLdScript
        data={buildMarketingEventJsonLd(event, pageUrl, imageUrl)}
      />
      <Navbar variant="light" />
      <main className="bg-background pb-16">
        <EventPageContent event={event} />
      </main>
      <Footer />
    </>
  );
}
