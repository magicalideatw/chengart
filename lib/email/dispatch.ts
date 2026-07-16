import { buildOrderEmailData } from "@/lib/email/build-order-email-data";
import { getEmailRuntimeConfig } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/service";
import { renderOrderEmail } from "@/lib/email/templates/order-emails";
import type { OrderEmailEvent } from "@/lib/email/types";
import type { Course } from "@/lib/courses/types";
import { logOrderEmail } from "@/lib/orders/email-logs";
import type { OrderRecord } from "@/lib/orders/types";
import {
  getBankTransferSettings,
  getEmailSettings,
} from "@/lib/settings/queries";

async function dispatchOrderEmail(
  event: OrderEmailEvent,
  data: ReturnType<typeof buildOrderEmailData>,
  orderId: string,
): Promise<boolean> {
  const rendered = renderOrderEmail(event, data);
  const config = await getEmailRuntimeConfig();

  if (!config) return false;

  if (event === "admin_new_order") {
    const sent = await sendEmail({
      to: [config.adminEmail],
      subject: rendered.subject,
      html: rendered.html,
      replyTo: config.replyToEmail,
    });

    await logOrderEmail({
      orderId,
      event,
      recipient: config.adminEmail,
      subject: rendered.subject,
      status: sent ? "sent" : "failed",
      errorMessage: sent ? null : "寄送失敗",
    });

    return sent;
  }

  const sent = await sendEmail({
    to: [data.parentEmail],
    subject: rendered.subject,
    html: rendered.html,
    replyTo: config.replyToEmail,
  });

  await logOrderEmail({
    orderId,
    event,
    recipient: data.parentEmail,
    subject: rendered.subject,
    status: sent ? "sent" : "failed",
    errorMessage: sent ? null : "寄送失敗",
  });

  return sent;
}

async function buildContext(input: {
  order: OrderRecord;
  course: Pick<Course, "sessionDate" | "sessionTime" | "transferDeadlineDays">;
  includeBankTransfer?: boolean;
}) {
  const bankTransferSettings = input.includeBankTransfer
    ? await getBankTransferSettings()
    : undefined;

  return buildOrderEmailData({
    order: input.order,
    course: input.course,
    bankTransferSettings,
  });
}

export async function notifyAdminNewOrder(input: {
  order: OrderRecord;
  course: Pick<Course, "sessionDate" | "sessionTime" | "transferDeadlineDays">;
}): Promise<void> {
  try {
    const emailData = await buildContext({
      order: input.order,
      course: input.course,
      includeBankTransfer: input.order.payment_method === "bank_transfer",
    });
    await dispatchOrderEmail("admin_new_order", emailData, input.order.id);
  } catch (error) {
    console.error("Admin new order email failed:", error);
  }
}

export async function notifyParentRegistrationSuccess(input: {
  order: OrderRecord;
  course: Pick<Course, "sessionDate" | "sessionTime" | "transferDeadlineDays">;
}): Promise<void> {
  try {
    const emailData = await buildContext({
      order: input.order,
      course: input.course,
    });
    await dispatchOrderEmail(
      "parent_registration_success",
      emailData,
      input.order.id,
    );
  } catch (error) {
    console.error("Parent registration success email failed:", error);
  }
}

export async function notifyParentBankTransferPending(input: {
  order: OrderRecord;
  course: Pick<Course, "sessionDate" | "sessionTime" | "transferDeadlineDays">;
}): Promise<void> {
  try {
    const emailData = await buildContext({
      order: input.order,
      course: input.course,
      includeBankTransfer: true,
    });
    await dispatchOrderEmail(
      "parent_bank_transfer_pending",
      emailData,
      input.order.id,
    );
  } catch (error) {
    console.error("Parent bank transfer pending email failed:", error);
  }
}

export async function notifyParentPaymentSuccess(input: {
  order: OrderRecord;
  course: Pick<Course, "sessionDate" | "sessionTime" | "transferDeadlineDays">;
}): Promise<void> {
  try {
    const paidOrder: OrderRecord = {
      ...input.order,
      order_status: "completed",
      payment_status: "paid",
      status: "paid",
    };
    const emailData = await buildContext({
      order: paidOrder,
      course: input.course,
    });
    await dispatchOrderEmail("parent_payment_success", emailData, input.order.id);
  } catch (error) {
    console.error("Parent payment success email failed:", error);
  }
}

export async function notifyParentPaymentConfirmed(input: {
  order: OrderRecord;
  course: Pick<Course, "sessionDate" | "sessionTime" | "transferDeadlineDays">;
}): Promise<void> {
  try {
    const paidOrder: OrderRecord = {
      ...input.order,
      order_status: "completed",
      payment_status: "paid",
      status: "paid",
    };
    const emailData = await buildContext({
      order: paidOrder,
      course: input.course,
    });
    await dispatchOrderEmail(
      "parent_payment_confirmed",
      emailData,
      input.order.id,
    );
  } catch (error) {
    console.error("Parent payment confirmed email failed:", error);
  }
}

export async function isEmailConfigured(): Promise<boolean> {
  const config = await getEmailRuntimeConfig();
  const settings = await getEmailSettings();
  const adminEmail =
    settings.adminEmail ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    config?.adminEmail;

  return Boolean(config?.apiKey && config.fromEmail && adminEmail);
}
