import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventPageContent } from "@/components/events/EventPageContent";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { events, getEventBySlug } from "@/src/data/events";
import { siteConfig } from "@/lib/data/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    return { title: "活動不存在" };
  }

  return {
    title: `${event.title} | ${siteConfig.name}`,
    description: event.subtitle,
    openGraph: {
      title: event.title,
      description: event.subtitle,
      images: [{ url: event.heroImage, width: 1200, height: 630 }],
    },
  };
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

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
