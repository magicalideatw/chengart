"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Ticket, Trash2, TrendingUp, Wallet } from "lucide-react";
import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmBankTransferModal } from "@/components/admin/ConfirmBankTransferModal";
import { ConfirmDestructiveActionModal } from "@/components/admin/ConfirmDestructiveActionModal";
import { ManualConfirmBankTransferModal } from "@/components/admin/ManualConfirmBankTransferModal";
import { Toast } from "@/components/ui/Toast";
import {
  clearAllPerformanceOrdersAction,
  deletePerformanceOrdersBatchAction,
  fetchPerformanceOrderClearCountAction,
} from "@/lib/actions/admin/bulk-delete";
import { confirmBankTransferPayment } from "@/lib/actions/admin/orders";
import {
  formatAdminSessionDate,
  formatAdminSessionWeekday,
  formatDateTime,
  formatFee,
  trimAdminTime,
} from "@/lib/admin/format";
import {
  canConfirmBankTransferPayment,
  canManualConfirmBankTransferPayment,
  getAdminPaymentStatusLabel,
  getAdminPaymentStatusStyle,
  isBankTransferOrder,
} from "@/lib/admin/order-transfer-display";
import {
  computePerformanceOrderStats,
  computeTicketTypeStats,
  DEFAULT_PERFORMANCE_ORDER_FILTERS,
  filterAndSortPerformanceOrders,
  getSimplePaymentStatusLabel,
  type PerformanceAdminOrderRow,
  type PerformanceCourseOption,
  type PerformanceOrderFilters,
} from "@/lib/admin/performance-order-management";
import { getRegistrationStatusLabel } from "@/lib/orders/order-status";
import { getPaymentMethodLabel } from "@/lib/payment/types";

type PerformanceOrderManagementProps = {
  orders: PerformanceAdminOrderRow[];
  performanceCourses: PerformanceCourseOption[];
  canMutate: boolean;
};

const TABLE_COLUMN_COUNT = 12;

type ToastState = {
  title: string;
  message?: string;
};

function PerformanceScheduleText({
  date,
  time,
  className = "text-xs text-muted",
}: {
  date: string;
  time: string;
  className?: string;
}) {
  const dateLabel = formatAdminSessionDate(date);
  const weekday = formatAdminSessionWeekday(date);
  const timeLabel = trimAdminTime(time);

  return (
    <div className={className}>
      {dateLabel !== "—" ? (
        <p>{weekday ? `${dateLabel}（${weekday}）` : dateLabel}</p>
      ) : null}
      {timeLabel ? <p className="mt-0.5">{timeLabel}</p> : null}
    </div>
  );
}

function PerformanceInfoCell({ order }: { order: PerformanceAdminOrderRow }) {
  return (
    <div className="min-w-[160px]">
      <p className="font-medium text-foreground">{order.performanceTitle}</p>
      <PerformanceScheduleText
        date={order.performanceDate}
        time={order.performanceTime}
        className="mt-1 text-xs text-muted"
      />
    </div>
  );
}

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

function applyPaidOverride(
  order: PerformanceAdminOrderRow,
  paidOrderIds: Set<string>,
): PerformanceAdminOrderRow {
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

function PerformanceOrderDetailPanel({ order }: { order: PerformanceAdminOrderRow }) {
  const isAtm = isBankTransferOrder(order);

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-surface/60 p-5 sm:p-6">
      <div className="rounded-2xl border border-border bg-white px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          演出
        </p>
        <p className="mt-2 font-display text-lg font-semibold text-foreground">
          {order.performanceTitle}
        </p>
        <PerformanceScheduleText
          date={order.performanceDate}
          time={order.performanceTime}
          className="mt-2 text-sm text-muted"
        />
        <p className="mt-3 font-mono text-xs text-muted">#{order.merchant_trade_no}</p>
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          購票人資訊
        </p>
        <div className="mt-3 rounded-2xl border border-border bg-white px-4 py-4">
          <p className="font-medium text-foreground">{order.name}</p>
          <p className="mt-2 text-sm text-muted">{order.phone}</p>
          <p className="mt-1 text-sm text-muted">{order.email}</p>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          票種
        </p>
        <div className="mt-3 space-y-3">
          {order.ticketLines.length > 0 ? (
            order.ticketLines.map((line) => (
              <div
                key={line.ticketTypeId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">{line.name}</p>
                  <p className="mt-1 text-sm text-muted">{line.quantity} 張</p>
                </div>
                <p className="text-sm font-medium text-gold">{formatFee(line.subtotal)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">—</p>
          )}
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          付款資訊
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-muted">總張數</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {order.ticketCount} 張
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-muted">總金額</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatFee(order.amount)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-muted">付款方式</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {isAtm ? "ATM" : getPaymentMethodLabel(order.payment_method)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-muted">付款狀態</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {getSimplePaymentStatusLabel(order)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white px-4 py-3 sm:col-span-2">
            <p className="text-xs text-muted">建立時間</p>
            <p className="mt-1 text-sm text-foreground">{formatDateTime(order.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PerformanceOrderManagement({
  orders,
  performanceCourses,
  canMutate,
}: PerformanceOrderManagementProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<PerformanceOrderFilters>(
    DEFAULT_PERFORMANCE_ORDER_FILTERS,
  );
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [modalOrder, setModalOrder] = useState<PerformanceAdminOrderRow | null>(null);
  const [manualModalOrder, setManualModalOrder] =
    useState<PerformanceAdminOrderRow | null>(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [paidOrderIds, setPaidOrderIds] = useState<Set<string>>(() => new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showClearAll, setShowClearAll] = useState(false);
  const [clearAllCount, setClearAllCount] = useState(0);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isPending, startTransition] = useTransition();

  const displayOrders = useMemo(
    () => orders.map((order) => applyPaidOverride(order, paidOrderIds)),
    [orders, paidOrderIds],
  );

  const filteredOrders = useMemo(
    () => filterAndSortPerformanceOrders(displayOrders, filters),
    [displayOrders, filters],
  );

  const visibleIds = useMemo(
    () => filteredOrders.map((order) => order.id),
    [filteredOrders],
  );
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        const next = new Set(current);
        for (const id of visibleIds) next.delete(id);
        return next;
      }

      const next = new Set(current);
      for (const id of visibleIds) next.add(id);
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const showToast = (title: string, message?: string) => {
    setToast({ title, message });
  };

  const handleDeleteSelected = () => {
    if (!canMutate || selectedIds.size === 0) return;

    const orderIds = filteredOrders
      .filter((order) => selectedIds.has(order.id))
      .map((order) => order.id);

    if (orderIds.length === 0) return;

    const selectedCount = selectedIds.size;
    const confirmed = window.confirm(
      `確定要刪除已選的 ${selectedCount} 筆演出訂單嗎？此操作無法復原。`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deletePerformanceOrdersBatchAction(orderIds);
      if (result.success) {
        setSelectedIds(new Set());
        showToast(`已刪除 ${selectedCount} 筆訂單`);
        router.refresh();
        return;
      }
      showToast("刪除失敗", result.error);
    });
  };

  const openClearAllDialog = () => {
    if (!canMutate) {
      showToast("無法刪除", "請確認已登入管理員");
      return;
    }

    startTransition(async () => {
      const result = await fetchPerformanceOrderClearCountAction();
      if (!result.success) {
        showToast("無法讀取資料", result.error);
        return;
      }
      setClearAllCount(result.count);
      setShowClearAll(true);
    });
  };

  const ordersForStats = useMemo(() => {
    if (filters.courseId === "all") {
      return displayOrders;
    }

    return displayOrders.filter((order) => order.course_id === filters.courseId);
  }, [displayOrders, filters.courseId]);

  const stats = useMemo(
    () => computePerformanceOrderStats(ordersForStats),
    [ordersForStats],
  );

  const ticketTypeStats = useMemo(
    () => computeTicketTypeStats(ordersForStats),
    [ordersForStats],
  );

  const updateFilter = <K extends keyof PerformanceOrderFilters>(
    key: K,
    value: PerformanceOrderFilters[K],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const toggleSortDirection = () => {
    setFilters((current) => ({
      ...current,
      sortDirection: current.sortDirection === "asc" ? "desc" : "asc",
    }));
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
    showToast("✅ 已確認收款");
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <>
      <AdminPageHeader
        title="演出購票"
        description="查看演出購票訂單、票種銷售統計與付款狀態"
        count={filteredOrders.length}
        countLabel="訂單數"
      />

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-10 md:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="目前售出張數"
            hint="已付款訂單"
            value={`${stats.soldTickets} 張`}
            icon={Ticket}
          />
          <StatCard
            label="總收入（已付款）"
            value={formatFee(stats.totalRevenue)}
            icon={TrendingUp}
          />
          <StatCard
            label="未付款訂單數"
            value={stats.unpaidOrderCount}
            icon={Wallet}
          />
        </section>

        <section className="rounded-3xl border border-border bg-white p-5 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">票種統計</h2>
          <p className="mt-1 text-sm text-muted">依已付款訂單統計各票種售出張數</p>

          {ticketTypeStats.items.length === 0 ? (
            <p className="mt-5 text-sm text-muted">尚無已付款的購票資料</p>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ticketTypeStats.items.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-border bg-surface/60 px-4 py-4"
                >
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="mt-2 text-2xl font-semibold text-gold">{item.count} 張</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-sm text-muted">
              總售出：
              <span className="ml-2 font-medium text-foreground">
                {ticketTypeStats.totalSold} 張
              </span>
            </p>
          </div>
        </section>

        <AdminSearchBar
          value={filters.query}
          onChange={(value) => updateFilter("query", value)}
          resultCount={filteredOrders.length}
          placeholder="搜尋姓名、電話、Email…"
        />

        <div className="rounded-3xl border border-border bg-white p-4 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FilterSelect
              label="演出"
              value={filters.courseId}
              onChange={(value) => updateFilter("courseId", value)}
            >
              <option value="all">全部</option>
              {performanceCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label="付款狀態"
              value={filters.paymentStatus}
              onChange={(value) =>
                updateFilter(
                  "paymentStatus",
                  value as PerformanceOrderFilters["paymentStatus"],
                )
              }
            >
              <option value="all">全部</option>
              <option value="paid">已付款</option>
              <option value="unpaid">未付款</option>
            </FilterSelect>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-xs text-muted">
            <span>排序：</span>
            <button
              type="button"
              onClick={toggleSortDirection}
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground transition hover:text-gold"
            >
              建立時間（{filters.sortDirection === "desc" ? "最新" : "最舊"}）
              <ChevronDown
                className={`h-3.5 w-3.5 ${filters.sortDirection === "asc" ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {selectedIds.size > 0 ? (
              <>
                <span className="text-sm text-muted">已選 {selectedIds.size} 筆</span>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={isPending || !canMutate}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  刪除選取
                </button>
              </>
            ) : null}
          </div>

          <button
            type="button"
            onClick={openClearAllDialog}
            disabled={isPending || !canMutate}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 shadow-[0_8px_40px_rgba(0,0,0,0.04)] transition hover:bg-red-50 disabled:opacity-50"
          >
            清空所有資料
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  <th className="whitespace-nowrap px-3 py-4 pl-5 font-medium text-muted">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      disabled={filteredOrders.length === 0 || !canMutate}
                      aria-label="全選"
                      className="h-4 w-4 accent-gold"
                    />
                  </th>
                  {[
                    "演出",
                    "購票人",
                    "電話",
                    "Email",
                    "票種",
                    "總張數",
                    "總金額",
                    "付款方式",
                    "付款狀態",
                    "建立時間",
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
                    <td colSpan={TABLE_COLUMN_COUNT} className="px-6 py-16 text-center text-muted">
                      尚無符合條件的演出購票訂單
                    </td>
                  </tr>
                ) : (
                  filteredOrders.flatMap((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const canConfirmTransfer = canConfirmBankTransferPayment(order);
                    const canManualConfirm = canManualConfirmBankTransferPayment(order);
                    const isAtm = isBankTransferOrder(order);

                    return [
                      <tr key={order.id} className="transition hover:bg-surface/60">
                        <td className="whitespace-nowrap px-3 py-3 pl-5">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(order.id)}
                            onChange={() => toggleSelected(order.id)}
                            disabled={!canMutate || isPending}
                            aria-label={`選取 ${order.name}`}
                            className="h-4 w-4 accent-gold"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <PerformanceInfoCell order={order} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-medium text-foreground">
                          {order.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-foreground">
                          {order.phone}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted">
                          {order.email}
                        </td>
                        <td className="min-w-[140px] px-3 py-3 text-foreground">
                          {order.ticketSummary}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center text-foreground">
                          {order.ticketCount}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-medium text-foreground">
                          {formatFee(order.amount)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-foreground">
                          {isAtm ? "ATM" : getPaymentMethodLabel(order.payment_method)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getAdminPaymentStatusStyle(order)}`}
                          >
                            {getAdminPaymentStatusLabel(order)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted">
                          {formatDateTime(order.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 pr-5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedOrderId((current) =>
                                  current === order.id ? null : order.id,
                                )
                              }
                              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold"
                            >
                              {isExpanded ? "收合" : "查看"}
                            </button>

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
                            ) : null}
                          </div>
                        </td>
                      </tr>,
                      isExpanded ? (
                        <tr key={`${order.id}-detail`}>
                          <td colSpan={TABLE_COLUMN_COUNT} className="bg-surface/30 px-5 py-4">
                            <PerformanceOrderDetailPanel order={order} />
                          </td>
                        </tr>
                      ) : null,
                    ].filter(Boolean);
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
          onClose={() => setModalOrder(null)}
          onConfirm={() => void handleConfirmBankTransfer()}
        />
      ) : null}

      {manualModalOrder ? (
        <ManualConfirmBankTransferModal
          order={manualModalOrder}
          open={Boolean(manualModalOrder)}
          isSubmitting={confirmingOrderId === manualModalOrder.id}
          onClose={() => setManualModalOrder(null)}
          onConfirm={() => void handleConfirmBankTransfer()}
        />
      ) : null}

      <Toast
        title={toast?.title ?? ""}
        message={toast?.message}
        visible={Boolean(toast)}
        onClose={() => setToast(null)}
      />

      <ConfirmDestructiveActionModal
        open={showClearAll}
        title="清空所有資料"
        description="將永久刪除所有演出購票訂單。課程、票種與付款設定不會被刪除。"
        itemCount={clearAllCount}
        confirmLabel="清空所有資料"
        onClose={() => setShowClearAll(false)}
        onConfirm={(confirmation) =>
          clearAllPerformanceOrdersAction({ confirmation })
        }
        onSuccess={(message) => {
          setSelectedIds(new Set());
          showToast(message);
          router.refresh();
        }}
      />
    </>
  );
}
