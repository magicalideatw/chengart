import Link from "next/link";
import { footerLinks, siteConfig } from "@/lib/data/site";

export function Footer() {
  return (
    <footer className="border-t border-border bg-foreground text-white">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/">
              <span className="font-display text-base font-semibold tracking-tight">
                {siteConfig.name}
              </span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
                {siteConfig.nameEn}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
              {siteConfig.slogan}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
              快速連結
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.explore.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/50 transition hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
              關於
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.about.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/50 transition hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
              聯絡資訊
            </h3>
            <div className="mt-4 space-y-2 text-sm text-white/50">
              <p>{siteConfig.email}</p>
              <p>{siteConfig.phone}</p>
            </div>
            <div className="mt-4 flex gap-3">
              {[
                { label: "LINE", href: siteConfig.line },
                { label: "FB", href: siteConfig.facebook },
                { label: "IG", href: siteConfig.instagram },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/40 transition hover:text-gold"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name} {siteConfig.nameEn}.
            All rights reserved.
          </p>
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
