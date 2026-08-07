import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { SpaceAboutSection } from "@/components/space/SpaceAboutSection";
import { SpaceCalendarSection } from "@/components/space/SpaceCalendarSection";
import { SpaceGallerySection } from "@/components/space/SpaceGallerySection";
import { SpaceHero } from "@/components/space/SpaceHero";
import { SpaceInquirySection } from "@/components/space/SpaceInquirySection";
import { SpaceLocationSection } from "@/components/space/SpaceLocationSection";
import { SpaceNoticeSection } from "@/components/space/SpaceNoticeSection";
import { SpacePricingSection } from "@/components/space/SpacePricingSection";
import { SpaceUsageSection } from "@/components/space/SpaceUsageSection";
import { buildPageMetadata, toAbsoluteUrl } from "@/lib/seo/metadata";
import { pageSeo } from "@/lib/seo/pages";
import { buildLocalBusinessJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildPageMetadata({
  ...pageSeo.space,
  image: toAbsoluteUrl("/images/space/hero.jpg"),
});

export default function SpaceRentalPage() {
  return (
    <>
      <JsonLdScript data={buildLocalBusinessJsonLd()} />
      <Navbar variant="space" />
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
