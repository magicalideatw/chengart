"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Download,
  Eye,
  Mail,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatDateTime, formatFee } from "@/lib/admin/format";
import {
  buildOrderExportRows,
  DEFAULT_ORDER_FILTERS,
  downloadTextFile,
  enrichOrderList,
  exportOrdersToCsv,
  exportOrdersToXlsx,
  filterAndSortOrders,
  type AdminOrderRow,
  type OrderListFilters,
  type OrderSortKey,
} from "@/lib/admin/order-management";
import { ConfirmBankTransferModal } from "@/components/admin/ConfirmBankTransferModal";
import { ManualConfirmBankTransferModal } from "@/components/admin/ManualConfirmBankTransferModal";
import {
  canConfirmBankTransferPayment,
  canManualConfirmBankTransferPayment,
  formatTransferDateDisplay,
  formatTransferTimeDisplay,
  getAdminPaymentStatusLabel,
  getAdminPaymentStatusStyle,
  isBankTransferOrder,
} from "@/lib/admin/order-transfer-display";
import { getRegistrationStatusLabel } from "@/lib/orders/order-status";
import {
  cancelAdminOrder,
  confirmBankTransferPayment,
  resendAdminPaymentEmail,
  resendAdminRegistrationEmail,
} from "@/lib/actions/admin/orders";
import type { OrderListItem } from "@/lib/orders/types";
import type { Course } from "@/lib/courses/types";
import {
  getPaymentMethodLabel,
  PAYMENT_METHODS,
} from "@/lib/payment/types";
import { Toast } from "@/components/ui/Toast";

type OrderManagementProps = {
  orders: OrderListItem[];
  courses: Course[];
  canMutate: boolean;
  focusOrderId?: string;
};

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-muted">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-full border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
      >
        {children}
      </select>
    </label>
  );
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: OrderListFilters["sortDirection"];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs font-medium transition ${
        active ? "text-foreground" : "text-muted hover:text-foreground"
      }`}
    >
      {label}
      {active ? (
        <ChevronDown
          className={`h-3.5 w-3.5 ${direction === "asc" ? "rotate-180" : ""}`}
        />
      ) : null}
    </button>
  );
}

function applyPaidOverride(
  order: AdminOrderRow,
  paidOrderIds: Set<string>,
): AdminOrderRow {
  if (!paidOrderIds.has(order.id)) return order;

  const patched = {
    ...order,
    payment_status: "paid" as const,
    status: "paid" as const,
    order_status: "completed" as const,
    paid_at: order.paid_at ?? new Date().toISOString(),
  };

  return {
    ...patched,
    registrationStatusLabel: getRegistrationStatusLabel(patched),
  };
}

export function OrderManagement({
  orders,
  courses,
  canMutate,
  focusOrderId,
}: OrderManagementProps) {
  const [filters, setFilters] = useState<OrderListFilters>(DEFAULT_ORDER_FILTERS);
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [modalOrder, setModalOrder] = useState<AdminOrderRow | null>(null);
  const [manualModalOrder, setManualModalOrder] = useState<AdminOrderRow | null>(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [paidOrderIds, setPaidOrderIds] = useState<Set<string>>(() => new Set());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const enrichedOrders = useMemo(() => enrichOrderList(orders), [orders]);
  const displayOrders = useMemo(
    () => enrichedOrders.map((order) => applyPaidOverride(order, paidOrderIds)),
    [enrichedOrders, paidOrderIds],
  );
  const filteredOrders = useMemo(
    () => filterAndSortOrders(displayOrders, filters),
    [displayOrders, filters],
  );

  useEffect(() => {
    if (!focusOrderId) return;
    const row = document.getElementById(`order-${focusOrderId}`);
    row?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusOrderId]);

  const updateFilter = <K extends keyof OrderListFilters>(
    key: K,
    value: OrderListFilters[K],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const toggleSort = (key: OrderSortKey) => {
    setFilters((current) => {
      if (current.sortKey === key) {
        return {
          ...current,
          sortDirection: current.sortDirection === "asc" ? "desc" : "asc",
        };
      }

      return {
        ...current,
        sortKey: key,
        sortDirection: key === "amount" ? "desc" : "desc",
      };
    });
  };

  const runAction = (
    action: () => Promise<{ success: boolean; error?: string }>,
    onSuccess?: () => void,
  ) => {
    if (!canMutate) return;

    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        window.alert(result.error ?? "操作失敗");
        return;
      }
      onSuccess?.();
      router.refresh();
    });
  };

  const handleExportCsv = () => {
    const rows = buildOrderExportRows(filteredOrders, formatDateTime);
    const csv = exportOrdersToCsv(rows);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`orders-${stamp}.csv`, csv, "text/csv;charset=utf-8");
  };

  const handleExportXlsx = async () => {
    const rows = buildOrderExportRows(filteredOrders, formatDateTime);
    const stamp = new Date().toISOString().slice(0, 10);
    await exportOrdersToXlsx(rows, `orders-${stamp}.xlsx`);
  };

  const handleConfirmBankTransfer = async () => {
    const activeOrder = modalOrder ?? manualModalOrder;
    if (!activeOrder || !canMutate) return;

    const orderId = activeOrder.id;
    setConfirmingOrderId(orderId);

    const result = await confirmBankTransferPayment(orderId);

    setConfirmingOrderId(null);

    if (!result.success) {
      window.alert(result.error ?? "操作失敗");
      return;
    }

    setPaidOrderIds((current) => new Set(current).add(orderId));
    setModalOrder(null);
    setManualModalOrder(null);
    setToastVisible(true);
  };

  return (
    <>
      <AdminPageHeader
        title="訂單管理"
        description="查看、搜尋、篩選與管理所有課程報名付款訂單"
        count={filteredOrders.length}
        countLabel="訂單數"
      />

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-10 md:px-8">
        <AdminSearchBar
          value={filters.query}
          onChange={(value) => updateFilter("query", value)}
          resultCount={filteredOrders.length}
          placeholder="搜尋訂單編號、姓名、Email、電話、學生姓名、課程…"
        />

        <div className="rounded-3xl border border-border bg-white p-4 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <FilterSelect
              label="付款狀態"
              value={filters.paymentStatus}
              onChange={(value) =>
                updateFilter(
                  "paymentStatus",
                  value as OrderListFilters["paymentStatus"],
                )
              }
            >
              <option value="all">全部</option>
              <option value="waiting_payment">等待付款</option>
              <option value="waiting_review">等待核帳</option>
              <option value="paid">已付款</option>
              <option value="cancelled">已取消</option>
            </FilterSelect>

            <FilterSelect
              label="付款方式"
              value={filters.paymentMethod}
              onChange={(value) =>
                updateFilter(
                  "paymentMethod",
                  value as OrderListFilters["paymentMethod"],
                )
              }
            >
              <option value="all">全部</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {getPaymentMethodLabel(method)}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label="課程"
              value={filters.courseId}
              onChange={(value) => updateFilter("courseId", value)}
            >
              <option value="all">全部課程</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </FilterSelect>

            <label className="flex flex-col gap-1.5 text-xs text-muted">
              <span>開始日期</span>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(event) => updateFilter("dateFrom", event.target.value)}
                className="rounded-full border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-muted">
              <span>結束日期</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(event) => updateFilter("dateTo", event.target.value)}
                className="rounded-full border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </label>

            <div className="flex flex-col justify-end gap-2 sm:col-span-2 lg:col-span-1">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold"
                >
                  <Download className="h-3.5 w-3.5" />
                  匯出 CSV
                </button>
                <button
                  type="button"
                  onClick={() => void handleExportXlsx()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold"
                >
                  <Download className="h-3.5 w-3.5" />
                  匯出 XLSX
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-xs text-muted">
            <span>排序：</span>
            <SortButton
              label="建立時間"
              active={filters.sortKey === "created_at"}
              direction={filters.sortDirection}
              onClick={() => toggleSort("created_at")}
            />
            <SortButton
              label="付款時間"
              active={filters.sortKey === "paid_at"}
              direction={filters.sortDirection}
              onClick={() => toggleSort("paid_at")}
            />
            <SortButton
              label="金額"
              active={filters.sortKey === "amount"}
              direction={filters.sortDirection}
              onClick={() => toggleSort("amount")}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  {[
                    "訂單編號",
                    "建立時間",
                    "課程",
                    "家長/成人",
                    "Email",
                    "電話",
                    "學生數",
                    "原價",
                    "優惠",
                    "折扣碼",
                    "實付",
                    "付款方式",
                    "付款狀態",
                    "後五碼",
                    "匯款日期",
                    "匯款時間",
                    "報名狀態",
                    "操作",
                  ].map((label) => (
                    <th
                      key={label}
                      className="whitespace-nowrap px-3 py-4 font-medium text-muted first:pl-5 last:pr-5"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={18}
                      className="px-6 py-16 text-center text-muted"
                    >
                      尚無符合條件的訂單
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const canConfirmTransfer = canConfirmBankTransferPayment(order);
                    const canManualConfirm =
                      canManualConfirmBankTransferPayment(order);
                    const isAtm = isBankTransferOrder(order);

                    const canCancel =
                      order.payment_status !== "paid" &&
                      order.payment_status !== "cancelled" &&
                      order.payment_status !== "refunded";

                    return (
                      <tr
                        key={order.id}
                        id={`order-${order.id}`}
                        className={`transition hover:bg-surface/60 ${
                          focusOrderId === order.id
                            ? "bg-gold-soft/50 ring-2 ring-inset ring-gold/30"
                            : ""
                        }`}
                      >
                        <td className="whitespace-nowrap px-3 py-3 pl-5 font-mono text-xs text-foreground">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="transition hover:text-gold"
                          >
                            {order.merchant_trade_no}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted">
                          {formatDateTime(order.created_at)}
                        </td>
                        <td className="min-w-[120px] max-w-[180px] truncate px-3 py-3 text-foreground">
                          {order.course_title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-medium text-foreground">
                          {order.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted">
                          {order.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-foreground">
                          {order.phone}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center text-foreground">
                          {order.studentCount}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted">
                          {formatFee(order.subtotalDisplay)}
                        </td>
                        <td className="min-w-[100px] px-3 py-3 text-emerald-700">
                          {order.discountDisplay}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-foreground">
                          {order.promo_code ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-medium text-foreground">
                          {formatFee(order.amount)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-foreground">
                          {isAtm
                            ? "ATM"
                            : getPaymentMethodLabel(order.payment_method)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getAdminPaymentStatusStyle(order)}`}
                          >
                            {getAdminPaymentStatusLabel(order)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-foreground">
                          {isAtm ? (order.transfer_last5 ?? "—") : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-foreground">
                          {isAtm
                            ? formatTransferDateDisplay(order.transfer_date)
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-foreground">
                          {isAtm
                            ? formatTransferTimeDisplay(order.transfer_time)
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-foreground">
                          {order.registrationStatusLabel}
                        </td>
                        <td className="relative min-w-[160px] whitespace-nowrap px-3 py-3 pr-5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {canConfirmTransfer && canMutate ? (
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
                            ) : canManualConfirm && canMutate ? (
                              <button
                                type="button"
                                disabled={confirmingOrderId === order.id}
                                onClick={() => setManualModalOrder(order)}
                                className="rounded-full border border-gold px-3 py-1.5 text-xs font-medium text-gold transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {confirmingOrderId === order.id
                                  ? "處理中..."
                                  : "手動確認收款"}
                              </button>
                            ) : isAtm && order.payment_status === "paid" ? (
                              <span className="text-xs font-medium text-emerald-700">
                                已付款
                              </span>
                            ) : null}
                            <Link
                              href={`/admin/orders/${order.id}`}
                              title="查看"
                              className="rounded-full p-1.5 text-muted transition hover:bg-surface hover:text-gold"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/admin/registrations?q=${encodeURIComponent(order.name)}`}
                              title="編輯"
                              className="rounded-full p-1.5 text-muted transition hover:bg-surface hover:text-gold"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              title="更多操作"
                              onClick={() =>
                                setOpenActionsId((current) =>
                                  current === order.id ? null : order.id,
                                )
                              }
                              className="rounded-full p-1.5 text-muted transition hover:bg-surface hover:text-foreground"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>

                          {openActionsId === order.id ? (
                            <div className="absolute right-3 top-full z-20 mt-1 min-w-[180px] rounded-2xl border border-border bg-white py-2 shadow-lg">
                              {canMutate ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => {
                                      setOpenActionsId(null);
                                      runAction(
                                        () => resendAdminPaymentEmail(order.id),
                                        () =>
                                          window.alert("已重寄付款通知信"),
                                      );
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition hover:bg-surface disabled:opacity-50"
                                  >
                                    <Mail className="h-4 w-4" />
                                    重寄付款信
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => {
                                      setOpenActionsId(null);
                                      runAction(
                                        () =>
                                          resendAdminRegistrationEmail(order.id),
                                        () =>
                                          window.alert("已重寄報名成功信"),
                                      );
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition hover:bg-surface disabled:opacity-50"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                    重寄報名信
                                  </button>
                                </>
                              ) : null}
                              {canCancel && canMutate ? (
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => {
                                    setOpenActionsId(null);
                                    if (
                                      !window.confirm("確定要取消此訂單嗎？")
                                    ) {
                                      return;
                                    }
                                    runAction(() => cancelAdminOrder(order.id));
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                  取消訂單
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {modalOrder ? (
        <ConfirmBankTransferModal
          order={modalOrder}
          open={Boolean(modalOrder)}
          isSubmitting={confirmingOrderId === modalOrder.id}
          onClose={() => {
            if (confirmingOrderId === modalOrder.id) return;
            setModalOrder(null);
          }}
          onConfirm={() => void handleConfirmBankTransfer()}
        />
      ) : null}

      {manualModalOrder ? (
        <ManualConfirmBankTransferModal
          order={manualModalOrder}
          open={Boolean(manualModalOrder)}
          isSubmitting={confirmingOrderId === manualModalOrder.id}
          onClose={() => {
            if (confirmingOrderId === manualModalOrder.id) return;
            setManualModalOrder(null);
          }}
          onConfirm={() => void handleConfirmBankTransfer()}
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
