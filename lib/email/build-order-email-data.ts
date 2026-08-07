import { formatDateTime, formatFee, formatSessionDate } from "@/lib/admin/format";
import { getCourseTransferDeadlineDays } from "@/lib/courses/enrollment";
import type { Course } from "@/lib/courses/types";
import type { OrderRecord } from "@/lib/orders/types";
import {
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/lib/payment/types";
import {
  formatPerformanceTicketSummary,
  getPerformanceSessionSnapshot,
  getPerformanceTicketLines,
  isPerformanceOrderFormData,
} from "@/lib/orders/order-form-data";
import { formatSessionCheckboxLabel } from "@/lib/sessions/format";
import {
  normalizeStudentsFromFormData,
  usesMultiSessionRegistration,
} from "@/lib/registration/types";
import type { BankTransferSettings } from "@/lib/settings/types";
import type { OrderEmailData } from "@/lib/email/types";
import { parsePricingSnapshot } from "@/lib/pricing/engine";

function formatTransferDeadlineLabel(
  createdAt: string,
  transferDeadlineDays: number,
): string {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return `${transferDeadlineDays} 天內`;
  }

  const deadline = new Date(created);
  deadline.setDate(deadline.getDate() + transferDeadlineDays);

  return `${transferDeadlineDays} 天內（${formatDateTime(deadline.toISOString())} 前）`;
}

export function buildOrderEmailData(input: {
  order: OrderRecord;
  course: Pick<Course, "sessionDate" | "sessionTime" | "transferDeadlineDays">;
  bankTransferSettings?: BankTransferSettings;
}): OrderEmailData {
  const { order, course, bankTransferSettings } = input;
  const formData = order.form_data;

  if (isPerformanceOrderFormData(formData)) {
    const ticketLines = getPerformanceTicketLines(formData);
    const ticketSummary = formatPerformanceTicketSummary(formData);
    const sessionSnapshot = getPerformanceSessionSnapshot(formData);
    const transferDeadlineDays = bankTransferSettings
      ? getCourseTransferDeadlineDays(
          course,
          bankTransferSettings.transferDeadlineDays,
        )
      : null;

    const sessionDate = sessionSnapshot
      ? formatSessionCheckboxLabel(sessionSnapshot.date)
      : formatSessionDate(course.sessionDate);
    const sessionTime = sessionSnapshot
      ? `${sessionSnapshot.startTime}–${sessionSnapshot.endTime}`
      : course.sessionTime || "—";

    return {
      courseTitle: order.course_title,
      parentName: order.name,
      parentEmail: order.email,
      parentPhone: order.phone,
      studentNames: ticketSummary,
      students: ticketLines.map((line) => ({
        name: line.name,
        age: `×${line.quantity}`,
        sessionDates: sessionDate,
        sessionTimes: sessionTime,
      })),
      sessionDate,
      sessionTime,
      paymentMethod: order.payment_method,
      paymentMethodLabel: getPaymentMethodLabel(order.payment_method),
      paymentStatus: order.payment_status,
      paymentStatusLabel: getPaymentStatusLabel(order.payment_status),
      merchantTradeNo: order.merchant_trade_no,
      subtotalLabel: formatFee(order.subtotal ?? order.amount),
      discountLabel: "—",
      promoCodeLabel: "—",
      amountLabel: formatFee(order.amount),
      registeredAt: formatDateTime(order.created_at),
      bankTransfer:
        bankTransferSettings && transferDeadlineDays
          ? {
              bankName: bankTransferSettings.bankName,
              bankCode: bankTransferSettings.bankCode,
              accountNumber: bankTransferSettings.accountNumber,
              accountName: bankTransferSettings.accountName,
              transferDeadlineLabel: formatTransferDeadlineLabel(
                order.created_at,
                transferDeadlineDays,
              ),
              reminderText: bankTransferSettings.reminderText,
            }
          : undefined,
    };
  }

  const students = normalizeStudentsFromFormData(formData);
  const usesSessions = usesMultiSessionRegistration(formData);
  const sessionSummaries = (formData.sessionSummaries ?? []).filter(Boolean);

  const sessionDate = usesSessions
    ? sessionSummaries.length > 0
      ? sessionSummaries.map((summary) => summary.split(" ").slice(1, 2).join(" ")).join("、") ||
        sessionSummaries.join("、")
      : `共 ${students.reduce((sum, student) => sum + (student.sessionIds?.length ?? 0), 0)} 堂`
    : formatSessionDate(course.sessionDate);

  const sessionTime = usesSessions
    ? sessionSummaries.length > 0
      ? sessionSummaries
          .map((summary) => {
            const match = summary.match(/(\d{2}:\d{2}~\d{2}:\d{2})/);
            return match?.[1] ?? summary;
          })
          .join("、")
      : "依各堂次時間"
    : course.sessionTime || "—";

  const emailStudents = students.map((student) => ({
    name: student.studentName,
    age: student.studentAge,
    sessionDates: usesSessions
      ? sessionSummaries.length > 0
        ? sessionSummaries.join("、")
        : `${student.sessionIds?.length ?? 0} 堂`
      : formatSessionDate(course.sessionDate),
    sessionTimes: usesSessions
      ? sessionSummaries.length > 0
        ? sessionSummaries
            .map((summary) => {
              const match = summary.match(/(\d{2}:\d{2}~\d{2}:\d{2})/);
              return match?.[1] ?? summary;
            })
            .join("、")
        : "依各堂次時間"
      : course.sessionTime || "—",
  }));

  const transferDeadlineDays = bankTransferSettings
    ? getCourseTransferDeadlineDays(
        course,
        bankTransferSettings.transferDeadlineDays,
      )
    : null;

  const pricingSnapshot =
    parsePricingSnapshot(order.pricing_snapshot) ??
    parsePricingSnapshot(formData.pricingSnapshot) ??
    null;

  const subtotal = pricingSnapshot?.subtotal ?? order.subtotal ?? order.amount;
  const discountTotal =
    pricingSnapshot?.discountTotal ?? order.discount_total ?? 0;
  const promoCode =
    order.promo_code ?? pricingSnapshot?.promoCode ?? formData.promoCode ?? null;

  return {
    courseTitle: order.course_title,
    parentName: order.name,
    parentEmail: order.email,
    parentPhone: order.phone,
    studentNames: students.map((student) => student.studentName).join("、"),
    students: emailStudents,
    sessionDate,
    sessionTime,
    paymentMethod: order.payment_method,
    paymentMethodLabel: getPaymentMethodLabel(order.payment_method),
    paymentStatus: order.payment_status,
    paymentStatusLabel: getPaymentStatusLabel(order.payment_status),
    merchantTradeNo: order.merchant_trade_no,
    subtotalLabel: formatFee(subtotal),
    discountLabel:
      discountTotal > 0 ? `- ${formatFee(discountTotal)}` : "—",
    promoCodeLabel: promoCode ?? "—",
    amountLabel: formatFee(order.amount),
    registeredAt: formatDateTime(order.created_at),
    bankTransfer:
      bankTransferSettings && transferDeadlineDays
        ? {
            bankName: bankTransferSettings.bankName,
            bankCode: bankTransferSettings.bankCode,
            accountNumber: bankTransferSettings.accountNumber,
            accountName: bankTransferSettings.accountName,
            transferDeadlineLabel: formatTransferDeadlineLabel(
              order.created_at,
              transferDeadlineDays,
            ),
            reminderText: bankTransferSettings.reminderText,
          }
        : undefined,
  };
}
