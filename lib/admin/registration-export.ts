import { formatAdminSessionDate } from "@/lib/admin/format";
import type { OrderExportMeta } from "@/lib/admin/registration-export-data";
import type { AdminOrderRegistration } from "@/lib/admin/types";
import {
  getAdminPaymentStatusLabel,
} from "@/lib/admin/order-transfer-display";
import {
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/lib/payment/types";

export type RegistrationExportPaymentFilter = "all" | "paid" | "unpaid";

export type RegistrationExportSortBy = "created_at" | "name";

export type RegistrationExportRow = {
  studentName: string;
  parentName: string;
  phone: string;
  email: string;
  paymentMethod: string;
  paymentStatus: string;
  orderNumber: string;
  registrationDate: string;
  sessionDate: string;
  sessionDateRaw: string;
  courseTitle: string;
  note: string;
  createdAt: string;
  isPaid: boolean;
};

export type RegistrationExportOptions = {
  paymentFilter: RegistrationExportPaymentFilter;
  sessionDates: string[] | "all";
  sortBy: RegistrationExportSortBy;
};

function formatSessionLabel(isoDate: string): string {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return `${month}/${day}`;
}

function resolvePaymentStatusLabel(
  registrationStatus: AdminOrderRegistration["status"],
  orderMeta?: OrderExportMeta,
): string {
  if (orderMeta?.paymentMethod === "bank_transfer") {
    return getAdminPaymentStatusLabel({
      payment_method: "bank_transfer",
      payment_status: orderMeta.paymentStatus,
      transfer_reported: orderMeta.transferReported,
    });
  }

  if (orderMeta?.paymentStatus) {
    return getPaymentStatusLabel(orderMeta.paymentStatus);
  }

  if (registrationStatus === "paid") return "已付款";
  if (registrationStatus === "cancelled") return "已取消";
  return "待付款";
}

function isPaidRegistration(
  registration: AdminOrderRegistration,
  orderMeta?: OrderExportMeta,
): boolean {
  if (orderMeta?.paymentStatus === "paid") return true;
  return registration.status === "paid";
}

function buildNote(
  studentNote: string | null,
  parentNote: string | null,
): string {
  const parts = [studentNote?.trim(), parentNote?.trim()].filter(Boolean);
  return parts.join("；");
}

export function flattenRegistrationExportRows(
  registrations: AdminOrderRegistration[],
  orders: Record<string, OrderExportMeta>,
): RegistrationExportRow[] {
  const rows: RegistrationExportRow[] = [];

  for (const registration of registrations) {
    if (registration.status === "cancelled") continue;

    const orderMeta = registration.order_id
      ? orders[registration.order_id]
      : undefined;
    const paid = isPaidRegistration(registration, orderMeta);
    const paymentMethod = orderMeta?.paymentMethod
      ? getPaymentMethodLabel(orderMeta.paymentMethod)
      : registration.orderAmount && registration.orderAmount > 0
        ? "—"
        : "免費";
    const paymentStatus = resolvePaymentStatusLabel(
      registration.status,
      orderMeta,
    );
    const orderNumber = orderMeta?.merchantTradeNo ?? "—";
    const registrationDate = formatExportDateOnly(registration.created_at);

    for (const student of registration.students) {
      const note = buildNote(student.note, registration.parent_note);
      const sessions =
        student.sessions.length > 0
          ? student.sessions
          : [
              {
                registrationId: student.registrationIds[0] ?? "",
                sessionId: null,
                date: "",
                start_time: "",
                end_time: "",
                className: "—",
                scheduleLine: "—",
                compactLine: "—",
              },
            ];

      for (const session of sessions) {
        rows.push({
          studentName: student.student_name,
          parentName: registration.name,
          phone: registration.phone,
          email: registration.email,
          paymentMethod:
            orderMeta?.paymentMethod === "bank_transfer" ? "ATM" : paymentMethod,
          paymentStatus,
          orderNumber,
          registrationDate,
          sessionDate: session.date
            ? formatAdminSessionDate(session.date)
            : "—",
          sessionDateRaw: session.date,
          courseTitle: registration.courseTitle,
          note,
          createdAt: registration.created_at,
          isPaid: paid,
        });
      }
    }
  }

  return rows;
}

export function collectAvailableSessionDates(
  rows: RegistrationExportRow[],
): Array<{ isoDate: string; label: string }> {
  const unique = new Map<string, string>();

  for (const row of rows) {
    if (!row.sessionDateRaw) continue;
    unique.set(row.sessionDateRaw, formatSessionLabel(row.sessionDateRaw));
  }

  return [...unique.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([isoDate, label]) => ({ isoDate, label }));
}

export function filterRegistrationExportRows(
  rows: RegistrationExportRow[],
  options: RegistrationExportOptions,
): RegistrationExportRow[] {
  let filtered = rows;

  if (options.paymentFilter === "paid") {
    filtered = filtered.filter((row) => row.isPaid);
  } else if (options.paymentFilter === "unpaid") {
    filtered = filtered.filter((row) => !row.isPaid);
  }

  if (options.sessionDates !== "all") {
    const selected = new Set(options.sessionDates);
    filtered = filtered.filter((row) =>
      row.sessionDateRaw ? selected.has(row.sessionDateRaw) : false,
    );
  }

  if (options.sortBy === "name") {
    filtered = [...filtered].sort((a, b) => {
      const byName = a.studentName.localeCompare(b.studentName, "zh-Hant");
      if (byName !== 0) return byName;
      return a.sessionDateRaw.localeCompare(b.sessionDateRaw);
    });
  } else {
    filtered = [...filtered].sort((a, b) => {
      const byTime =
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (byTime !== 0) return byTime;
      return a.studentName.localeCompare(b.studentName, "zh-Hant");
    });
  }

  return filtered;
}

export function sanitizeExportFilename(title: string): string {
  const stamp = getTaipeiExportDateStamp();
  const sanitized = title
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const base = sanitized || "報名匯出";
  return `${base}_${stamp}.xlsx`;
}

function getTaipeiExportDateStamp(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return parts.replace(/-/g, "");
}

export function formatExportDateOnly(iso: string | null | undefined): string {
  if (!iso) return "—";
  const normalized = iso.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized.replace(/-/g, "/");
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts.replace(/-/g, "/");
}

export function formatCourseDateLabel(sessionDate: string): string {
  if (!sessionDate) return "—";
  return formatAdminSessionDate(sessionDate);
}
