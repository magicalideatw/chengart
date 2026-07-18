import { Resend } from "resend";
import type { OrderRecord } from "@/lib/orders/types";
import type { PaymentMethod } from "@/lib/payment/types";
import { getPaymentMethodLabel } from "@/lib/payment/types";

const ADMIN_EMAIL = "chengart.theatre@gmail.com";
const FROM_ADDRESS = "晟心誠藝劇團 <noreply@chengart.tw>";
const ADMIN_ORDERS_URL = "https://chengart.tw/admin/orders";
const SITE_URL = "https://chengart.tw";

export type AdminNotificationEmailInput = {
  name: string;
  email: string;
  phone: string;
  activityName: string;
  orderNumber: string;
  paymentMethod: string;
  amount: number;
  time: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatAmount(amount: number): string {
  return `NT$ ${amount.toLocaleString("zh-TW")}`;
}

function formatNotificationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
}

function renderNotificationHtml(
  title: string,
  data: AdminNotificationEmailInput,
): string {
  const rows: Array<[string, string]> = [
    ["姓名", data.name],
    ["Email", data.email],
    ["電話", data.phone],
    ["活動名稱", data.activityName],
    ["訂單編號", data.orderNumber],
    ["付款方式", data.paymentMethod],
    ["金額", formatAmount(data.amount)],
    ["時間", data.time],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;width:120px">${escapeHtml(label)}</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family:sans-serif;color:#111827;line-height:1.6">
  <h2 style="margin:0 0 16px">${escapeHtml(title)}</h2>
  <table style="border-collapse:collapse;width:100%;max-width:560px">${tableRows}</table>
  <p style="margin:24px 0 0">
    後台：<a href="${ADMIN_ORDERS_URL}" style="color:#2563eb">${ADMIN_ORDERS_URL}</a>
  </p>
  <p style="margin:32px 0 0;color:#6b7280;font-size:14px">
    本信件由系統自動寄出<br />
    晟心誠藝劇團<br />
    <a href="${SITE_URL}" style="color:#2563eb">${SITE_URL}</a>
  </p>
</body>
</html>`;
}

async function sendAdminNotification(
  subject: string,
  title: string,
  data: AdminNotificationEmailInput,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("[lib/email] RESEND_API_KEY not configured, skipping email");
    return false;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [ADMIN_EMAIL],
    subject,
    html: renderNotificationHtml(title, data),
    replyTo: data.email,
  });

  if (error) {
    console.error("[lib/email] Failed to send:", error);
    return false;
  }

  return true;
}

export function buildAdminNotificationFromOrder(
  order: OrderRecord,
  options?: { paymentMethod?: PaymentMethod; time?: string },
): AdminNotificationEmailInput {
  const timestamp = options?.time ?? order.paid_at ?? order.created_at;

  return {
    name: order.name,
    email: order.email,
    phone: order.phone,
    activityName: order.course_title,
    orderNumber: order.merchant_trade_no,
    paymentMethod: getPaymentMethodLabel(
      options?.paymentMethod ?? order.payment_method,
    ),
    amount: order.amount,
    time: formatNotificationTime(timestamp),
  };
}

export async function sendNewCourseRegistrationEmail(
  data: AdminNotificationEmailInput,
): Promise<boolean> {
  return sendAdminNotification(
    "【晟心誠藝劇團】新課程報名通知",
    "新課程報名通知",
    data,
  );
}

export async function sendNewPerformanceOrderEmail(
  data: AdminNotificationEmailInput,
): Promise<boolean> {
  return sendAdminNotification(
    "【晟心誠藝劇團】新演出票券訂單",
    "新演出票券訂單",
    data,
  );
}

export async function sendPaymentSuccessEmail(
  data: AdminNotificationEmailInput,
): Promise<boolean> {
  return sendAdminNotification(
    "【晟心誠藝劇團】付款成功通知",
    "付款成功通知",
    data,
  );
}
