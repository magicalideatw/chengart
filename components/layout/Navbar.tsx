"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { navLinks, siteConfig } from "@/lib/data/site";

type NavbarProps = {
  variant?: "default" | "light";
};

export function Navbar({ variant = "default" }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isLight = variant === "light";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          isLight || scrolled
            ? "border-b border-border bg-white/95 py-3 shadow-sm backdrop-blur-md"
            : "bg-black/20 py-4 backdrop-blur-sm md:py-5"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 md:px-8">
          <Link
            href="/"
            className={`transition-colors ${
              isLight || scrolled ? "text-foreground" : "text-white"
            }`}
          >
            <span
              className={`block font-display font-semibold tracking-tight transition-all duration-500 ${
                isLight || scrolled ? "text-sm md:text-base" : "text-base md:text-lg"
              }`}
            >
              {siteConfig.name}
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[13px] font-medium transition-opacity hover:opacity-60 ${
                  isLight || scrolled ? "text-foreground/80" : "text-white/90"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            aria-label={menuOpen ? "關閉選單" : "開啟選單"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className={`flex h-10 w-10 items-center justify-center lg:hidden ${
              menuOpen || isLight || scrolled ? "text-foreground" : "text-white"
            }`}
          >
            <div className="flex w-[18px] flex-col gap-[5px]">
              <span
                className={`block h-px bg-current transition-all ${menuOpen ? "translate-y-[6px] rotate-45" : ""}`}
              />
              <span
                className={`block h-px bg-current transition-all ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-px bg-current transition-all ${menuOpen ? "-translate-y-[6px] -rotate-45" : ""}`}
              />
            </div>
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-white transition-all duration-500 lg:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex h-full flex-col justify-center gap-6 px-8 pt-16">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-display text-2xl font-semibold text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
