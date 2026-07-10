import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventPageContent } from "@/components/events/EventPageContent";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getEventBySlug } from "@/lib/events/queries";
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

  return {
    title: `${event.title} | ${siteConfig.name}`,
    description: event.subtitle || event.intro,
    openGraph: {
      title: event.title,
      description: event.subtitle || event.intro,
      images: event.coverImage
        ? [{ url: event.coverImage, width: 1200, height: 630 }]
        : undefined,
    },
  };
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return (
    <>
      <Navbar variant="light" />
      <main className="bg-background pb-16">
        <EventPageContent event={event} />
      </main>
      <Footer />
    </>
  );
}
