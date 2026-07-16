import { enrichOrderListItem } from "@/lib/admin/order-management";
import type { AdminOrderRow } from "@/lib/admin/order-management";
import { mapOrderRow } from "@/lib/orders/queries";
import type { PaymentStatus } from "@/lib/payment/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

const TAIPEI_TZ = "Asia/Taipei";

export type AdminDashboardStats = {
  activeActivities: number;
  todayOrders: number;
  pendingTransferReview: number;
  todayRegistrations: number;
  monthRevenue: number;
  upcomingActivities: number;
};

export type AdminDashboardRecentOrder = {
  id: string;
  merchantTradeNo: string;
  name: string;
  courseTitle: string;
  amount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

export type AdminDashboardRecentRegistration = {
  id: string;
  parentName: string;
  studentName: string;
  courseTitle: string;
  status: string;
  createdAt: string;
};

export type AdminDashboardData = {
  stats: AdminDashboardStats;
  pendingTransferOrders: AdminOrderRow[];
  recentOrders: AdminDashboardRecentOrder[];
  recentRegistrations: AdminDashboardRecentRegistration[];
};

type DateRange = {
  startIso: string;
  endIso: string;
};

function getTaipeiDateParts(date = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TAIPEI_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

function getTaipeiDayRange(date = new Date()): DateRange {
  const { year, month, day } = getTaipeiDateParts(date);
  const dateKey = `${year}-${padDatePart(month)}-${padDatePart(day)}`;

  return {
    startIso: `${dateKey}T00:00:00+08:00`,
    endIso: `${dateKey}T23:59:59.999+08:00`,
  };
}

function getTaipeiMonthRange(date = new Date()): DateRange {
  const { year, month } = getTaipeiDateParts(date);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return {
    startIso: `${year}-${padDatePart(month)}-01T00:00:00+08:00`,
    endIso: `${nextYear}-${padDatePart(nextMonth)}-01T00:00:00+08:00`,
  };
}

function getTaipeiTodayIsoDate(): string {
  const { year, month, day } = getTaipeiDateParts();
  return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
}

function addDaysToIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isWithinHalfOpenRange(
  iso: string | null | undefined,
  range: DateRange,
): boolean {
  if (!iso) return false;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return false;
  return (
    time >= new Date(range.startIso).getTime() &&
    time < new Date(range.endIso).getTime()
  );
}

function parsePaymentStatus(value: unknown): PaymentStatus {
  if (
    value === "pending" ||
    value === "waiting_transfer" ||
    value === "paid" ||
    value === "cancelled" ||
    value === "refunded"
  ) {
    return value;
  }
  return "pending";
}

function sumAmounts(rows: Array<{ amount?: number | null }>): number {
  return rows.reduce((total, row) => {
    const amount = Number(row.amount ?? 0);
    return Number.isFinite(amount) ? total + amount : total;
  }, 0);
}

const EMPTY_DASHBOARD: AdminDashboardData = {
  stats: {
    activeActivities: 0,
    todayOrders: 0,
    pendingTransferReview: 0,
    todayRegistrations: 0,
    monthRevenue: 0,
    upcomingActivities: 0,
  },
  pendingTransferOrders: [],
  recentOrders: [],
  recentRegistrations: [],
};

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  if (!isSupabaseConfigured()) return EMPTY_DASHBOARD;

  const supabase = await createServerClient();
  const todayRange = getTaipeiDayRange();
  const monthRange = getTaipeiMonthRange();
  const todayIso = getTaipeiTodayIsoDate();
  const weekEndIso = addDaysToIsoDate(todayIso, 7);

  const [
    activeActivitiesResult,
    todayOrdersResult,
    pendingTransferResult,
    todayRegistrationsResult,
    monthPaidOrdersResult,
    upcomingCoursesResult,
    recentOrdersResult,
    recentRegistrationsResult,
    courseTitleResult,
  ] = await Promise.all([
    supabase
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("is_open", true),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayRange.startIso)
      .lte("created_at", todayRange.endIso)
      .neq("payment_status", "cancelled"),
    supabase
      .from("orders")
      .select("*")
      .eq("payment_method", "bank_transfer")
      .eq("transfer_reported", true)
      .neq("payment_status", "paid")
      .order("transfer_reported_at", { ascending: true }),
    supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayRange.startIso)
      .lte("created_at", todayRange.endIso),
    supabase
      .from("orders")
      .select("amount, paid_at, created_at")
      .eq("payment_status", "paid"),
    supabase
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("is_open", true)
      .gte("session_date", todayIso)
      .lte("session_date", weekEndIso),
    supabase
      .from("orders")
      .select(
        "id, merchant_trade_no, name, course_title, amount, payment_status, created_at",
      )
      .neq("payment_status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("registrations")
      .select("id, name, student_name, course_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("courses").select("id, title"),
  ]);

  const courseTitles = new Map(
    (courseTitleResult.data ?? []).map((row) => [
      String(row.id),
      String(row.title),
    ]),
  );

  const monthRevenueRows = (monthPaidOrdersResult.data ?? []).filter((order) =>
    isWithinHalfOpenRange(order.paid_at ?? order.created_at, monthRange),
  );

  const pendingRows = pendingTransferResult.data ?? [];
  const pendingTransferOrders = pendingRows.map((row) =>
    enrichOrderListItem(mapOrderRow(row)),
  );

  const recentOrders: AdminDashboardRecentOrder[] = (
    recentOrdersResult.data ?? []
  ).map((row) => ({
    id: String(row.id),
    merchantTradeNo: String(row.merchant_trade_no),
    name: String(row.name),
    courseTitle: String(row.course_title),
    amount: Number(row.amount ?? 0),
    paymentStatus: parsePaymentStatus(row.payment_status),
    createdAt: String(row.created_at),
  }));

  const recentRegistrations: AdminDashboardRecentRegistration[] = (
    recentRegistrationsResult.data ?? []
  ).map((row) => ({
    id: String(row.id),
    parentName: String(row.name),
    studentName: String(row.student_name),
    courseTitle: courseTitles.get(String(row.course_id)) ?? "—",
    status: String(row.status),
    createdAt: String(row.created_at),
  }));

  return {
    stats: {
      activeActivities: activeActivitiesResult.count ?? 0,
      todayOrders: todayOrdersResult.count ?? 0,
      pendingTransferReview: pendingRows.length,
      todayRegistrations: todayRegistrationsResult.count ?? 0,
      monthRevenue: sumAmounts(monthRevenueRows),
      upcomingActivities: upcomingCoursesResult.count ?? 0,
    },
    pendingTransferOrders,
    recentOrders,
    recentRegistrations,
  };
}

/** @deprecated Legacy shape for older callers */
export async function fetchAdminDashboardStats() {
  const data = await fetchAdminDashboardData();
  return {
    courses: data.stats.activeActivities,
    registrations: data.stats.todayRegistrations,
    orders: data.stats.todayOrders,
    pendingOrders: data.stats.pendingTransferReview,
    paidOrders: 0,
    paidRegistrations: 0,
    announcements: 0,
    activeAnnouncements: 0,
    pendingPayment: data.stats.pendingTransferReview,
    paid: 0,
    refunded: 0,
    freeOrders: 0,
    bankTransferOrders: data.stats.pendingTransferReview,
    ecpayOrders: 0,
    freeActivities: 0,
    openCourses: data.stats.activeActivities,
    fullCourses: 0,
    closedCourses: 0,
  };
}
