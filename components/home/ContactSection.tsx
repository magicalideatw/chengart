import { Mail } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/icons/SocialIcons";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { siteConfig } from "@/lib/data/site";

const contactEmail = siteConfig.email;
const instagramUrl = siteConfig.instagram;
const facebookUrl = siteConfig.facebook;

const linkClass =
  "mt-2 flex items-center gap-3 break-all text-sm text-muted transition hover:text-foreground";

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
          <div className="mx-auto max-w-xl space-y-6">
            <div>
              <p className="text-sm font-medium text-foreground">Email</p>
              <a href={`mailto:${contactEmail}`} className={linkClass}>
                <Mail className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                {contactEmail}
              </a>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">Instagram</p>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <InstagramIcon className="h-4 w-4 shrink-0 text-gold" />
                {instagramUrl}
              </a>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">Facebook</p>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <FacebookIcon className="h-4 w-4 shrink-0 text-gold" />
                {facebookUrl}
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
