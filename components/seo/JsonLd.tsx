import { siteConfig } from "@/lib/data/site";

export function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "PerformingArtsTheater",
    name: siteConfig.name,
    alternateName: siteConfig.nameEn,
    description: siteConfig.description,
    url: siteConfig.url,
    email: siteConfig.email,
    sameAs: [siteConfig.facebook, siteConfig.instagram],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
