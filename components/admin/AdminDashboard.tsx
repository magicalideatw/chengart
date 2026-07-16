import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  LayoutGrid,
  PlusCircle,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardPendingTransfers } from "@/components/admin/DashboardPendingTransfers";
import { formatDateTime, formatFee } from "@/lib/admin/format";
import type { AdminDashboardData } from "@/lib/admin/dashboard";
import { getPaymentStatusLabel } from "@/lib/payment/types";

type AdminDashboardProps = {
  data: AdminDashboardData;
  canMutate: boolean;
};

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-3xl border border-border bg-white p-5 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gold-soft text-gold">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
        {children}
      </h2>
      {action}
    </div>
  );
}

const quickActions = [
  { href: "/admin/events", label: "新增活動", icon: PlusCircle },
  { href: "/admin/events", label: "活動管理", icon: Sparkles },
  { href: "/admin/orders", label: "訂單管理", icon: CreditCard },
  { href: "/admin/registrations", label: "報名管理", icon: ClipboardList },
] as const;

export function AdminDashboard({ data, canMutate }: AdminDashboardProps) {
  const { stats } = data;

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-5 py-10 md:px-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="活動數"
          hint="目前啟用中的活動"
          value={stats.activeActivities}
          icon={LayoutGrid}
        />
        <StatCard
          label="今日訂單"
          hint="今天新增訂單"
          value={stats.todayOrders}
          icon={CreditCard}
        />
        <StatCard
          label="待核帳"
          hint="ATM 已回報、尚未確認收款"
          value={stats.pendingTransferReview}
          icon={ClipboardList}
        />
        <StatCard
          label="今日報名"
          hint="今天新增 registration"
          value={stats.todayRegistrations}
          icon={Users}
        />
        <StatCard
          label="本月收入"
          hint="已付款訂單金額總和"
          value={formatFee(stats.monthRevenue)}
          icon={TrendingUp}
        />
        <StatCard
          label="即將開始活動"
          hint="七天內開始"
          value={stats.upcomingActivities}
          icon={CalendarDays}
        />
      </section>

      <section className="space-y-4">
        <SectionTitle
          action={
            stats.pendingTransferReview > 0 ? (
              <Link
                href="/admin/orders?status=waiting_review"
                className="text-sm font-medium text-gold transition hover:text-gold/80"
              >
                查看全部
              </Link>
            ) : null
          }
        >
          待核帳
        </SectionTitle>
        <DashboardPendingTransfers
          orders={data.pendingTransferOrders}
          canMutate={canMutate}
        />
      </section>

      <div className="grid gap-10 xl:grid-cols-2">
        <section className="space-y-4">
          <SectionTitle
            action={
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-gold transition hover:text-gold/80"
              >
                查看全部
              </Link>
            }
          >
            最近五筆訂單
          </SectionTitle>
          <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-surface">
                  <tr>
                    {["訂單編號", "姓名", "活動", "金額", "狀態", "時間"].map(
                      (label) => (
                        <th
                          key={label}
                          className="whitespace-nowrap px-4 py-4 font-medium text-muted first:pl-6 last:pr-6"
                        >
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-muted"
                      >
                        尚無訂單
                      </td>
                    </tr>
                  ) : (
                    data.recentOrders.map((order) => (
                      <tr key={order.id} className="transition hover:bg-surface/60">
                        <td className="whitespace-nowrap px-4 py-3 pl-6 font-mono text-xs">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-foreground transition hover:text-gold"
                          >
                            {order.merchantTradeNo}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-foreground">
                          {order.name}
                        </td>
                        <td className="max-w-[160px] truncate px-4 py-3 text-foreground">
                          {order.courseTitle}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-foreground">
                          {formatFee(order.amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="inline-flex rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-foreground">
                            {getPaymentStatusLabel(order.paymentStatus)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 pr-6 text-muted">
                          {formatDateTime(order.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            action={
              <Link
                href="/admin/registrations"
                className="text-sm font-medium text-gold transition hover:text-gold/80"
              >
                查看全部
              </Link>
            }
          >
            最近五筆報名
          </SectionTitle>
          <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-surface">
                  <tr>
                    {["家長", "學生", "活動", "狀態", "時間"].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap px-4 py-4 font-medium text-muted first:pl-6 last:pr-6"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentRegistrations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-muted"
                      >
                        尚無報名紀錄
                      </td>
                    </tr>
                  ) : (
                    data.recentRegistrations.map((item) => (
                      <tr key={item.id} className="transition hover:bg-surface/60">
                        <td className="whitespace-nowrap px-4 py-3 pl-6 font-medium text-foreground">
                          {item.parentName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-foreground">
                          {item.studentName}
                        </td>
                        <td className="max-w-[160px] truncate px-4 py-3 text-foreground">
                          {item.courseTitle}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-foreground">
                          {item.status === "paid"
                            ? "已付款"
                            : getPaymentStatusLabel(
                                item.status === "cancelled"
                                  ? "cancelled"
                                  : "pending",
                              )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 pr-6 text-muted">
                          {formatDateTime(item.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <SectionTitle>快速操作</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-3.5 text-sm font-medium text-foreground shadow-[0_8px_40px_rgba(0,0,0,0.04)] transition hover:border-gold hover:text-gold"
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
