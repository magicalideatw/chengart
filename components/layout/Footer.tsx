import Link from "next/link";
import { footerLinks, siteConfig } from "@/lib/data/site";

export function Footer() {
  return (
    <footer className="border-t border-border bg-foreground text-white">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-14">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
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

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-white/50 transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="text-sm text-white/50">
            <p>{siteConfig.email}</p>
            <p className="mt-1">{siteConfig.phone}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
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
