import { Mail, MapPin } from "lucide-react";
import { siteConfig } from "@/lib/data/site";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";

const socialLinks = [
  { label: "LINE", href: siteConfig.line },
  { label: "Facebook", href: siteConfig.facebook },
  { label: "Instagram", href: siteConfig.instagram },
];

export function ContactSection() {
  return (
    <section id="contact" className="bg-surface py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label="Contact"
            title="聯絡我們"
            description="歡迎透過以下方式與我們聯繫。"
            align="center"
          />
        </FadeIn>

        <FadeIn className="mt-10 sm:mt-14" delay={0.08}>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-gold hover:text-gold"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center gap-3 text-sm text-muted transition hover:text-foreground"
              >
                <Mail className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                {siteConfig.email}
              </a>

              <p className="flex items-start gap-3 text-sm text-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                {siteConfig.address}
              </p>

              <p className="text-sm text-muted">{siteConfig.phone}</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-white">
              <iframe
                title="晟心誠藝劇團 Google Map"
                src="https://maps.google.com/maps?q=Taipei%20Performing%20Arts%20Center&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="aspect-[4/3] w-full border-0 lg:aspect-video"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
