"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmBankTransferModal } from "@/components/admin/ConfirmBankTransferModal";
import { formatFee, formatDateTime } from "@/lib/admin/format";
import type { AdminOrderRow } from "@/lib/admin/order-management";
import {
  formatTransferDateDisplay,
  formatTransferTimeDisplay,
} from "@/lib/admin/order-transfer-display";
import { confirmBankTransferPayment } from "@/lib/actions/admin/orders";
import { Toast } from "@/components/ui/Toast";

type DashboardPendingTransfersProps = {
  orders: AdminOrderRow[];
  canMutate: boolean;
};

function formatTransferDateTime(
  date: string | null,
  time: string | null,
): string {
  const dateLabel = formatTransferDateDisplay(date);
  const timeLabel = formatTransferTimeDisplay(time);
  if (dateLabel === "—" && timeLabel === "—") return "—";
  if (dateLabel === "—") return timeLabel;
  if (timeLabel === "—") return dateLabel;
  return `${dateLabel} ${timeLabel}`;
}

export function DashboardPendingTransfers({
  orders: initialOrders,
  canMutate,
}: DashboardPendingTransfersProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [modalOrder, setModalOrder] = useState<AdminOrderRow | null>(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [paidOrderIds, setPaidOrderIds] = useState<Set<string>>(() => new Set());
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const visibleOrders = useMemo(
    () => orders.filter((order) => !paidOrderIds.has(order.id)),
    [orders, paidOrderIds],
  );

  const handleConfirm = async () => {
    if (!modalOrder || !canMutate) return;

    const orderId = modalOrder.id;
    setConfirmingOrderId(orderId);

    const result = await confirmBankTransferPayment(orderId);
    setConfirmingOrderId(null);

    if (!result.success) {
      window.alert(result.error ?? "操作失敗");
      return;
    }

    setPaidOrderIds((current) => new Set(current).add(orderId));
    setModalOrder(null);
    setToastVisible(true);
    router.refresh();
  };

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                {[
                  "姓名",
                  "活動",
                  "金額",
                  "後五碼",
                  "匯款時間",
                  "操作",
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
              {visibleOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-muted"
                  >
                    目前沒有待核帳的 ATM 匯款
                  </td>
                </tr>
              ) : (
                visibleOrders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-surface/60">
                    <td className="whitespace-nowrap px-4 py-3 pl-6 font-medium text-foreground">
                      {order.name}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-foreground">
                      {order.course_title}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground">
                      {formatFee(order.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-foreground">
                      {order.transfer_last5 ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground">
                      {formatTransferDateTime(
                        order.transfer_date,
                        order.transfer_time,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 pr-6">
                      {canMutate ? (
                        <button
                          type="button"
                          disabled={confirmingOrderId === order.id}
                          onClick={() => setModalOrder(order)}
                          className="rounded-full bg-gold px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {confirmingOrderId === order.id
                            ? "處理中..."
                            : "確認收款"}
                        </button>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOrder ? (
        <ConfirmBankTransferModal
          order={modalOrder}
          open={Boolean(modalOrder)}
          isSubmitting={confirmingOrderId === modalOrder.id}
          onClose={() => {
            if (confirmingOrderId === modalOrder.id) return;
            setModalOrder(null);
          }}
          onConfirm={() => void handleConfirm()}
        />
      ) : null}

      <Toast
        title="✅ 已確認收款"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </>
  );
}
