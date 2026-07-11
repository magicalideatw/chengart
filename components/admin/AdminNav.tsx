"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { signOut } from "@/lib/actions/auth";

const links = [
  { href: "/admin", label: "總覽", exact: true },
  { href: "/admin/courses", label: "課程" },
  { href: "/admin/registrations", label: "報名" },
  { href: "/admin/orders", label: "訂單" },
  { href: "/admin/settings", label: "設定" },
  { href: "/admin/announcements", label: "公告" },
  { href: "/admin/events", label: "活動" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
      router.refresh();
    });
  };

  return (
    <nav className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-5 py-3 md:px-8">
        <div className="flex gap-2">
          {links.map((link) => {
            const isActive = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-foreground text-white"
                    : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted transition hover:border-foreground/20 hover:bg-surface hover:text-foreground disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          {isPending ? "登出中…" : "登出"}
        </button>
      </div>
    </nav>
  );
}
