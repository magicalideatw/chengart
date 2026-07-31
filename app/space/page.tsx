import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SpaceAboutSection } from "@/components/space/SpaceAboutSection";
import { SpaceCalendarSection } from "@/components/space/SpaceCalendarSection";
import { SpaceGallerySection } from "@/components/space/SpaceGallerySection";
import { SpaceHero } from "@/components/space/SpaceHero";
import { SpaceInquirySection } from "@/components/space/SpaceInquirySection";
import { SpaceLocationSection } from "@/components/space/SpaceLocationSection";
import { SpaceNoticeSection } from "@/components/space/SpaceNoticeSection";
import { SpacePricingSection } from "@/components/space/SpacePricingSection";
import { SpaceUsageSection } from "@/components/space/SpaceUsageSection";

export const metadata: Metadata = {
  title: "場地租借｜二階藝術空間｜晟心誠藝劇團",
  description:
    "提供中原地區場地租借，適合戲劇排練、舞蹈、魔術、藝術課程、工作坊及講座等多元用途。",
};

export default function SpaceRentalPage() {
  return (
    <>
      <Navbar />
      <main>
        <SpaceHero />
        <SpaceAboutSection />
        <SpaceUsageSection />
        <SpaceGallerySection />
        <SpacePricingSection />
        <SpaceCalendarSection />
        <SpaceLocationSection />
        <SpaceNoticeSection />
        <SpaceInquirySection />
      </main>
      <Footer />
    </>
  );
}
