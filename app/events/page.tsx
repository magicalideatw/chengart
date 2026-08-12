import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { EventsListingSection } from "@/components/events/EventsListingSection";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { pageSeo } from "@/lib/seo/pages";

export const metadata: Metadata = buildPageMetadata(pageSeo.events);

export default function EventsPage() {
  return (
    <>
      <Navbar />
      <main>
        <EventsListingSection headingLevel="h1" />
      </main>
      <Footer />
    </>
  );
}
