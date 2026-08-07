import { buildSiteJsonLdGraph } from "@/lib/seo/json-ld";
import { JsonLdScript } from "@/components/seo/JsonLdScript";

export function JsonLd() {
  return <JsonLdScript data={buildSiteJsonLdGraph()} />;
}
