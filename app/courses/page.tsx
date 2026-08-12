import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CoursesSection } from "@/components/home/CoursesSection";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { pageSeo } from "@/lib/seo/pages";

export const metadata: Metadata = buildPageMetadata(pageSeo.courses);

export default function CoursesPage() {
  return (
    <>
      <Navbar />
      <main>
        <CoursesSection headingLevel="h1" />
      </main>
      <Footer />
    </>
  );
}
