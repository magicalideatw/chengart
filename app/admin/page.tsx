import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fetchAdminDashboardStats } from "@/lib/admin/dashboard";

export const metadata: Metadata = {
  title: "後台總覽",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const cards = [
  {
    href: "/admin/courses",
    label: "課程管理",
    description: "新增、編輯、刪除課程與開放報名設定",
    statKey: "courses" as const,
    statLabel: "課程數",
  },
  {
    href: "/admin/registrations",
    label: "報名管理",
    description: "查看與編輯所有報名資料、付款狀態",
    statKey: "registrations" as const,
    statLabel: "報名數",
  },
  {
    href: "/admin/orders",
    label: "訂單管理",
    description: "查看付款訂單與綠界交易紀錄",
    statKey: "orders" as const,
    statLabel: "訂單數",
  },
  {
    href: "/admin/announcements",
    label: "首頁公告",
    description: "管理首頁顯示的公告訊息",
    statKey: "announcements" as const,
    statLabel: "公告數",
  },
];

export default async function AdminDashboardPage() {
  const stats = await fetchAdminDashboardStats();

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="後台總覽"
        description="管理課程、報名、訂單與首頁公告"
      />

      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              待付款訂單
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-amber-700">
              {stats.pendingOrders}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              已付款訂單
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-emerald-700">
              {stats.paidOrders}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              已付款報名
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-foreground">
              {stats.paidRegistrations}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              進行中公告
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-gold">
              {stats.activeAnnouncements}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] transition hover:border-gold/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-gold">
                    {card.label}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {card.description}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-2xl font-semibold text-foreground">
                    {stats[card.statKey]}
                  </p>
                  <p className="mt-1 text-xs text-muted">{card.statLabel}</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-gold">進入管理 →</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
