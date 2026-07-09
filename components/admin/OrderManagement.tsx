"use client";

import { formatDateTime, formatFee } from "@/lib/admin/format";
import type { OrderListItem } from "@/lib/orders/types";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const STATUS_LABELS: Record<OrderListItem["status"], string> = {
  pending: "待付款",
  paid: "已付款",
  failed: "付款失敗",
  cancelled: "已取消",
};

const STATUS_STYLES: Record<OrderListItem["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-surface text-muted",
};

type OrderManagementProps = {
  orders: OrderListItem[];
};

export function OrderManagement({ orders }: OrderManagementProps) {
  return (
    <>
      <AdminPageHeader
        title="訂單管理"
        description="查看所有課程報名付款訂單"
        count={orders.length}
        countLabel="訂單數"
      />

      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  {[
                    "訂單編號",
                    "姓名",
                    "課程",
                    "金額",
                    "付款方式",
                    "狀態",
                    "建立時間",
                  ].map((label) => (
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
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-muted">
                      尚無訂單
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="transition hover:bg-surface/60">
                      <td className="whitespace-nowrap px-4 py-4 pl-6 font-mono text-xs text-foreground">
                        {order.merchant_trade_no}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <p className="font-medium text-foreground">{order.name}</p>
                        <p className="mt-1 text-xs text-muted">{order.email}</p>
                      </td>
                      <td className="min-w-[140px] px-4 py-4 text-foreground">
                        {order.course_title}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-foreground">
                        {formatFee(order.amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-foreground">
                        {order.payment_method ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[order.status]}`}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 pr-6 text-muted">
                        {formatDateTime(order.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
