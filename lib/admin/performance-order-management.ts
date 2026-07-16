import { enrichOrderListItem, type AdminOrderRow } from "@/lib/admin/order-management";
import { isOrderPaid, type OrderListItem } from "@/lib/orders/types";
import {
  formatPerformanceTicketSummary,
  getPerformanceTicketCount,
  getPerformanceTicketLines,
  isPerformanceOrderFormData,
} from "@/lib/orders/order-form-data";
import type { TicketPurchaseLine } from "@/lib/validation/ticket-purchase-schema";

export type PerformanceCourseOption = {
  id: string;
  title: string;
  sessionDate: string;
  sessionTime: string;
};

export type PerformanceAdminOrderRow = AdminOrderRow & {
  ticketSummary: string;
  ticketCount: number;
  ticketLines: TicketPurchaseLine[];
  performanceTitle: string;
  performanceDate: string;
  performanceTime: string;
};

export type PerformancePaymentFilter = "all" | "paid" | "unpaid";

export type PerformanceOrderFilters = {
  query: string;
  paymentStatus: PerformancePaymentFilter;
  courseId: string | "all";
  sortDirection: "asc" | "desc";
};

export const DEFAULT_PERFORMANCE_ORDER_FILTERS: PerformanceOrderFilters = {
  query: "",
  paymentStatus: "all",
  courseId: "all",
  sortDirection: "desc",
};

export type PerformanceOrderStats = {
  soldTickets: number;
  totalRevenue: number;
  unpaidOrderCount: number;
};

export type TicketTypeStat = {
  name: string;
  count: number;
};

export type TicketTypeStats = {
  items: TicketTypeStat[];
  totalSold: number;
};

export function buildPerformanceCourseOptions(
  courses: Array<{
    id: string;
    title: string;
    activityType: string;
    sessionDate: string;
    sessionTime: string;
  }>,
): PerformanceCourseOption[] {
  return courses
    .filter((course) => course.activityType === "performance")
    .map((course) => ({
      id: course.id,
      title: course.title,
      sessionDate: course.sessionDate,
      sessionTime: course.sessionTime,
    }))
    .sort((left, right) =>
      left.title.localeCompare(right.title, "zh-Hant") ||
      left.sessionDate.localeCompare(right.sessionDate),
    );
}

export function buildPerformanceCourseMap(
  courses: PerformanceCourseOption[],
): Map<string, PerformanceCourseOption> {
  return new Map(courses.map((course) => [course.id, course]));
}

export function buildPerformanceCourseIdSet(
  courses: Array<{ id: string; activityType: string }>,
): Set<string> {
  return new Set(
    courses
      .filter((course) => course.activityType === "performance")
      .map((course) => course.id),
  );
}

export function isPerformanceOrderRecord(
  order: OrderListItem,
  performanceCourseIds: ReadonlySet<string>,
): boolean {
  if (isPerformanceOrderFormData(order.form_data)) {
    return true;
  }

  return Boolean(order.course_id && performanceCourseIds.has(order.course_id));
}

export function filterPerformanceOrders(
  orders: OrderListItem[],
  performanceCourseIds: ReadonlySet<string>,
): OrderListItem[] {
  return orders.filter((order) =>
    isPerformanceOrderRecord(order, performanceCourseIds),
  );
}

export function enrichPerformanceOrderRow(
  order: OrderListItem,
  courseById: ReadonlyMap<string, PerformanceCourseOption>,
): PerformanceAdminOrderRow {
  const base = enrichOrderListItem(order);
  const course = courseById.get(order.course_id);

  return {
    ...base,
    ticketSummary: formatPerformanceTicketSummary(order.form_data),
    ticketCount: getPerformanceTicketCount(order.form_data),
    ticketLines: getPerformanceTicketLines(order.form_data),
    performanceTitle: course?.title ?? order.course_title,
    performanceDate: course?.sessionDate ?? "",
    performanceTime: course?.sessionTime ?? "",
  };
}

export function enrichPerformanceOrderList(
  orders: OrderListItem[],
  courseById: ReadonlyMap<string, PerformanceCourseOption>,
): PerformanceAdminOrderRow[] {
  return orders.map((order) => enrichPerformanceOrderRow(order, courseById));
}

function isUnpaidPerformanceOrder(order: Pick<OrderListItem, "payment_status">): boolean {
  return (
    order.payment_status !== "paid" &&
    order.payment_status !== "cancelled" &&
    order.payment_status !== "refunded"
  );
}

function matchesPerformancePaymentFilter(
  order: Pick<OrderListItem, "payment_status" | "status">,
  filter: PerformancePaymentFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "paid") return isOrderPaid(order);
  return isUnpaidPerformanceOrder(order);
}

export function filterAndSortPerformanceOrders(
  orders: PerformanceAdminOrderRow[],
  filters: PerformanceOrderFilters,
): PerformanceAdminOrderRow[] {
  const keyword = filters.query.trim().toLowerCase();

  const filtered = orders.filter((order) => {
    if (
      filters.courseId !== "all" &&
      order.course_id !== filters.courseId
    ) {
      return false;
    }

    if (!matchesPerformancePaymentFilter(order, filters.paymentStatus)) {
      return false;
    }

    if (!keyword) return true;

    return [order.name, order.phone, order.email].some((value) =>
      value.toLowerCase().includes(keyword),
    );
  });

  return filtered.sort((left, right) => {
    const leftTime = new Date(left.created_at).getTime();
    const rightTime = new Date(right.created_at).getTime();
    const direction = filters.sortDirection === "asc" ? 1 : -1;

    if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
      return 0;
    }

    return (leftTime - rightTime) * direction;
  });
}

export function computePerformanceOrderStats(
  orders: PerformanceAdminOrderRow[],
): PerformanceOrderStats {
  let soldTickets = 0;
  let totalRevenue = 0;
  let unpaidOrderCount = 0;

  for (const order of orders) {
    if (isOrderPaid(order)) {
      soldTickets += order.ticketCount;
      totalRevenue += order.amount;
    } else if (isUnpaidPerformanceOrder(order)) {
      unpaidOrderCount += 1;
    }
  }

  return {
    soldTickets,
    totalRevenue,
    unpaidOrderCount,
  };
}

export function computeTicketTypeStats(
  orders: PerformanceAdminOrderRow[],
): TicketTypeStats {
  const counts = new Map<string, number>();

  for (const order of orders) {
    if (!isOrderPaid(order)) continue;

    for (const line of order.ticketLines) {
      counts.set(line.name, (counts.get(line.name) ?? 0) + line.quantity);
    }
  }

  const items = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "zh-Hant"));

  const totalSold = items.reduce((sum, item) => sum + item.count, 0);

  return { items, totalSold };
}

export function getSimplePaymentStatusLabel(
  order: Pick<OrderListItem, "payment_status" | "status">,
): string {
  return isOrderPaid(order) ? "已付款" : "未付款";
}
