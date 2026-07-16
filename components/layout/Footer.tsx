import Link from "next/link";
import { FacebookIcon, InstagramIcon } from "@/components/icons/SocialIcons";
import { footerLinks, siteConfig } from "@/lib/data/site";

const socialLinks = [
  {
    label: "Instagram",
    href: siteConfig.instagram,
    Icon: InstagramIcon,
  },
  {
    label: "Facebook",
    href: siteConfig.facebook,
    Icon: FacebookIcon,
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-foreground text-white">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <div className="max-w-sm">
            <Link href="/">
              <span className="font-display text-base font-semibold tracking-tight">
                {siteConfig.name}
              </span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
                {siteConfig.nameEn}
              </span>
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-white/50">
              {siteConfig.footerSlogan}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-white/30 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <nav className="flex flex-col gap-3 sm:gap-2.5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
              快速連結
            </p>
            <div className="flex flex-col gap-2.5">
              {footerLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-white/50 transition hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>

          <div id="contact" className="text-sm text-white/50">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
              聯絡資訊
            </p>
            <a
              href={`mailto:${siteConfig.email}`}
              className="mt-3 block transition hover:text-white"
            >
              {siteConfig.email}
            </a>
            <a
              href={siteConfig.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block transition hover:text-white"
            >
              Facebook
            </a>
            <a
              href={siteConfig.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block transition hover:text-white"
            >
              Instagram
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>{siteConfig.footerCopyright}</p>
          <div className="flex gap-6">
            <Link href="#" className="transition hover:text-white/50">
              隱私權政策
            </Link>
            <Link href="#" className="transition hover:text-white/50">
              服務條款
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
