import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LatestPerformancesSection } from "@/components/home/LatestPerformancesSection";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { pageSeo } from "@/lib/seo/pages";

export const metadata: Metadata = buildPageMetadata(pageSeo.performances);

export default function PerformancesPage() {
  return (
    <>
      <Navbar />
      <main>
        <LatestPerformancesSection headingLevel="h1" />
      </main>
      <Footer />
    </>
  );
}
