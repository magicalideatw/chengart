import { generateMerchantTradeNo, isEcpayConfigured } from "@/lib/ecpay/config";
import type { Course } from "@/lib/courses/types";
import {
  buildAdminNotificationFromOrder,
  sendNewPerformanceOrderEmail,
} from "@/lib/email";
import {
  notifyAdminNewOrder,
  notifyParentBankTransferPending,
} from "@/lib/email/dispatch";
import { createOrder, getOrderById } from "@/lib/orders/queries";
import type { OrderFormData } from "@/lib/orders/order-form-data";
import type { OrderRecord } from "@/lib/orders/types";
import { fulfillOnSiteOrderById, fulfillOrderById } from "@/lib/payment/fulfill-order";
import type { PaymentMethod, PaymentStatus } from "@/lib/payment/types";
import { resolveAvailablePaymentMethods } from "@/lib/payment/types";
import type { PricingSnapshot } from "@/lib/pricing/types";

export type FinalizeOrderResult =
  | { success: true; orderId: string; redirectPath: string; paymentMethod: PaymentMethod }
  | { success: false; error: string };

export function getOrderRedirectPath(
  orderId: string,
  paymentMethod: PaymentMethod,
): string {
  switch (paymentMethod) {
    case "free":
    case "on_site":
      return `/payment/success?orderId=${orderId}`;
    case "bank_transfer":
      return `/payment/bank-transfer/${orderId}`;
    case "ecpay":
    default:
      return `/payment/checkout/${orderId}`;
  }
}

export function assertOrderPaymentMethod(input: {
  course: Pick<Course, "allowedPaymentMethods">;
  totalAmount: number;
  paymentMethod: PaymentMethod;
}): string | null {
  if (input.paymentMethod === "on_site") {
    if (input.totalAmount <= 0) {
      return "免費活動不需選擇現場繳費";
    }
    return null;
  }

  const availableMethods = resolveAvailablePaymentMethods({
    allowedMethods: input.course.allowedPaymentMethods,
    totalAmount: input.totalAmount,
  });

  if (!availableMethods.includes(input.paymentMethod)) {
    return "此活動不支援所選付款方式";
  }

  if (input.paymentMethod === "ecpay" && !isEcpayConfigured()) {
    console.error(
      "ECPay not configured: missing ECPAY_MERCHANT_ID, ECPAY_HASH_KEY, or ECPAY_HASH_IV",
    );
    return "金流尚未設定，請聯絡管理員";
  }

  return null;
}

export async function finalizeCreatedOrder(input: {
  course: Course;
  paymentMethod: PaymentMethod;
  merchantTradeNo: string;
  amount: number;
  subtotal: number;
  discountTotal?: number;
  promoCode?: string | null;
  pricingSnapshot?: PricingSnapshot | Record<string, unknown>;
  formData: OrderFormData;
  paymentStatus: PaymentStatus;
}): Promise<FinalizeOrderResult> {
  const { order, error } = await createOrder({
    merchantTradeNo: input.merchantTradeNo,
    courseId: input.course.id,
    courseTitle: input.course.title,
    amount: input.amount,
    subtotal: input.subtotal,
    discountTotal: input.discountTotal ?? 0,
    promoCode: input.promoCode ?? null,
    pricingSnapshot: input.pricingSnapshot,
    formData: input.formData,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus,
  });

  if (!order) {
    return { success: false, error: error ?? "建立訂單失敗" };
  }

  if (input.paymentMethod !== "free") {
    void notifyAdminNewOrder({ order, course: input.course }).catch((emailError) => {
      console.error("Admin new order email failed:", emailError);
    });

    void sendNewPerformanceOrderEmail(
      buildAdminNotificationFromOrder(order, {
        paymentMethod: input.paymentMethod,
      }),
    ).catch((emailError) => {
      console.error("Resend new performance order email failed:", emailError);
    });
  }

  if (input.paymentMethod === "bank_transfer") {
    void notifyParentBankTransferPending({ order, course: input.course }).catch(
      (emailError) => {
        console.error("Bank transfer pending email failed:", emailError);
      },
    );
  }

  if (input.paymentMethod === "free") {
    const fulfillment = await fulfillOrderById(order.id);
    if (!fulfillment.success) {
      return { success: false, error: fulfillment.error };
    }

    const paidOrder = await getOrderById(order.id);
    if (paidOrder) {
      void notifyAdminNewOrder({ order: paidOrder, course: input.course }).catch(
        (emailError) => {
          console.error("Admin new order email failed:", emailError);
        },
      );

      void sendNewPerformanceOrderEmail(
        buildAdminNotificationFromOrder(paidOrder, {
          paymentMethod: "free",
        }),
      ).catch((emailError) => {
        console.error("Resend new performance order email failed:", emailError);
      });
    }

    return {
      success: true,
      orderId: order.id,
      redirectPath: getOrderRedirectPath(order.id, "free"),
      paymentMethod: "free",
    };
  }

  if (input.paymentMethod === "on_site") {
    const fulfillment = await fulfillOnSiteOrderById(order.id);
    if (!fulfillment.success) {
      return { success: false, error: fulfillment.error };
    }

    return {
      success: true,
      orderId: order.id,
      redirectPath: getOrderRedirectPath(order.id, "on_site"),
      paymentMethod: "on_site",
    };
  }

  return {
    success: true,
    orderId: order.id,
    redirectPath: getOrderRedirectPath(order.id, input.paymentMethod),
    paymentMethod: input.paymentMethod,
  };
}

export function buildMerchantTradeNoAndPaymentStatus(paymentMethod: PaymentMethod): {
  merchantTradeNo: string;
  paymentStatus: PaymentStatus;
} {
  return {
    merchantTradeNo: generateMerchantTradeNo(),
    paymentStatus: paymentMethod === "bank_transfer" ? "waiting_transfer" : "pending",
  };
}

export type { OrderRecord };
