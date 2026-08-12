import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NewsSection } from "@/components/home/NewsSection";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { pageSeo } from "@/lib/seo/pages";

export const metadata: Metadata = buildPageMetadata(pageSeo.news);

export default function NewsPage() {
  return (
    <>
      <Navbar />
      <main>
        <NewsSection headingLevel="h1" />
      </main>
      <Footer />
    </>
  );
}
