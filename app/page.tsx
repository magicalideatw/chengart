import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { ActivitiesSection } from "@/components/home/ActivitiesSection";
import { CoursesSection } from "@/components/home/CoursesSection";
import { PerformanceServicesSection } from "@/components/home/PerformanceServicesSection";
import { AboutSection } from "@/components/home/AboutSection";
import { FacultySection } from "@/components/home/FacultySection";
import { PartnersSection } from "@/components/home/PartnersSection";
import { NewsSection } from "@/components/home/NewsSection";
import { ContactSection } from "@/components/home/ContactSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ActivitiesSection />
        <CoursesSection />
        <PerformanceServicesSection />
        <AboutSection />
        <FacultySection />
        <PartnersSection />
        <NewsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
