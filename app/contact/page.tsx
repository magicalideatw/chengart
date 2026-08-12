import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ContactSection } from "@/components/home/ContactSection";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { pageSeo } from "@/lib/seo/pages";

export const metadata: Metadata = buildPageMetadata(pageSeo.contact);

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main>
        <ContactSection headingLevel="h1" />
      </main>
      <Footer />
    </>
  );
}
