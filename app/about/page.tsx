import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AboutSection } from "@/components/home/AboutSection";
import { PerformanceServicesSection } from "@/components/home/PerformanceServicesSection";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { pageSeo } from "@/lib/seo/pages";

export const metadata: Metadata = buildPageMetadata(pageSeo.about);

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        <AboutSection headingLevel="h1" />
        <PerformanceServicesSection />
      </main>
      <Footer />
    </>
  );
}
