import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { PerformanceServicesSection } from "@/components/home/PerformanceServicesSection";
import { LatestPerformancesSection } from "@/components/home/LatestPerformancesSection";
import { CoursesSection } from "@/components/home/CoursesSection";
import { AboutSection } from "@/components/home/AboutSection";
import { NewsSection } from "@/components/home/NewsSection";
import { ContactSection } from "@/components/home/ContactSection";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { pageSeo } from "@/lib/seo/pages";

export const metadata: Metadata = buildPageMetadata(pageSeo.home);

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <LatestPerformancesSection />
        <CoursesSection />
        <AboutSection />
        <PerformanceServicesSection />
        <NewsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
