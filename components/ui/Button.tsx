import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "gold";
  className?: string;
};

const variants = {
  primary:
    "bg-foreground text-white hover:bg-foreground/90",
  secondary:
    "bg-white text-foreground hover:bg-white/90",
  outline:
    "border border-white/40 bg-transparent text-white hover:bg-white/10",
  gold:
    "bg-gold text-white hover:bg-gold-light",
};

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
