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
    telephone: siteConfig.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "台北市",
      addressCountry: "TW",
    },
    sameAs: [siteConfig.facebook, siteConfig.instagram, siteConfig.line],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
