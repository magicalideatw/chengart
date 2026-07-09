import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  CreditCard,
  Megaphone,
} from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = {
  title: "後台首頁",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const entries = [
  {
    href: "/admin/courses",
    label: "課程管理",
    description: "新增、編輯、刪除課程，設定名額、費用與開放報名",
    icon: BookOpen,
  },
  {
    href: "/admin/registrations",
    label: "報名管理",
    description: "查看所有報名資料、付款狀態，編輯或刪除紀錄",
    icon: ClipboardList,
  },
  {
    href: "/admin/orders",
    label: "訂單管理",
    description: "查看綠界付款訂單、付款方式與交易狀態",
    icon: CreditCard,
  },
  {
    href: "/admin/announcements",
    label: "首頁公告管理",
    description: "設定首頁顯示的公告訊息與上下架時間",
    icon: Megaphone,
  },
] as const;

export default async function AdminHomePage() {
  const user = await getAuthenticatedUser();

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="後台首頁"
        description={user ? `歡迎回來，${user.email ?? "管理員"}` : "管理後台"}
      />

      <main className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {entries.map((entry) => {
            const Icon = entry.icon;

            return (
              <Link
                key={entry.href}
                href={entry.href}
                className="group flex gap-4 rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] transition hover:border-gold/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-soft text-gold transition group-hover:bg-gold group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-foreground group-hover:text-gold">
                    {entry.label}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {entry.description}
                  </p>
                  <p className="mt-3 text-sm font-medium text-gold">進入 →</p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
