import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { PerformanceServicesSection } from "@/components/home/PerformanceServicesSection";
import { LatestPerformancesSection } from "@/components/home/LatestPerformancesSection";
import { CoursesSection } from "@/components/home/CoursesSection";
import { AboutSection } from "@/components/home/AboutSection";
import { NewsSection } from "@/components/home/NewsSection";
import { ContactSection } from "@/components/home/ContactSection";

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
