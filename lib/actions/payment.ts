"use server";

import { generateMerchantTradeNo, isEcpayConfigured } from "@/lib/ecpay/config";
import { getCourseWithEnrollment } from "@/lib/courses/queries";
import { createOrder } from "@/lib/orders/queries";
import { fulfillOrderById } from "@/lib/payment/fulfill-order";
import type { PaymentMethod } from "@/lib/payment/types";
import {
  isPaymentMethod,
  resolveAvailablePaymentMethods,
} from "@/lib/payment/types";
import {
  buildSessionPriceMap,
  calculateOrderTotal,
} from "@/lib/registration/pricing";
import {
  getCourseRegistrationPlan,
  validateSessionSelection,
} from "@/lib/registration/queries";
import {
  normalizeStudentsFromFormData,
  resolveOrderSessionIds,
  type RegistrationOrderFormData,
} from "@/lib/registration/types";
import { isSupabaseConfigured } from "@/lib/supabase";
import { registrationOrderFormSchema } from "@/lib/validation/registration-schema";

export type CreateRegistrationOrderInput = {
  courseId: string;
  formData: RegistrationOrderFormData;
  sessionIds?: string[];
  paymentMethod: PaymentMethod;
};

export type CreateRegistrationOrderResult =
  | { success: true; orderId: string; redirectPath: string; paymentMethod: PaymentMethod }
  | { success: false; error: string };

function getRedirectPath(orderId: string, paymentMethod: PaymentMethod): string {
  switch (paymentMethod) {
    case "free":
      return `/payment/success?orderId=${orderId}`;
    case "bank_transfer":
      return `/payment/bank-transfer/${orderId}`;
    case "ecpay":
    default:
      return `/payment/checkout/${orderId}`;
  }
}

export async function createRegistrationOrder(
  input: CreateRegistrationOrderInput,
): Promise<CreateRegistrationOrderResult> {
  const parsed = registrationOrderFormSchema.safeParse(input.formData);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  if (!isPaymentMethod(input.paymentMethod)) {
    return { success: false, error: "請選擇有效的付款方式" };
  }

  const course = await getCourseWithEnrollment(input.courseId);

  if (!course) {
    return { success: false, error: "找不到此課程" };
  }

  if (!course.isOpen) {
    return { success: false, error: "此課程目前未開放報名" };
  }

  const orderFormData: RegistrationOrderFormData = parsed.data;
  const students = normalizeStudentsFromFormData(orderFormData);

  if (students.length === 0) {
    return { success: false, error: "請至少新增一位學生" };
  }

  const plan = await getCourseRegistrationPlan(course.id);
  const usesSessions = plan?.usesSessions ?? false;
  const sessionPriceMap = plan ? buildSessionPriceMap(plan) : new Map();

  if (usesSessions) {
    const missingSessions = students.some(
      (student) => (student.sessionIds?.length ?? 0) === 0,
    );
    if (missingSessions) {
      return { success: false, error: "每位學生都需至少選擇一堂上課日期" };
    }
  }

  const allSessionIds = resolveOrderSessionIds({
    formData: orderFormData,
    sessionIds: input.sessionIds,
  });

  let amount = calculateOrderTotal({
    usesSessions,
    courseFee: course.fee,
    students,
    sessionPriceMap,
    defaultUnitPrice: plan?.defaultUnitPrice ?? course.fee,
  });

  let enrichedFormData: RegistrationOrderFormData = {
    ...orderFormData,
    students,
    paymentMethod: input.paymentMethod,
  };

  if (usesSessions && allSessionIds.length > 0) {
    const validation = await validateSessionSelection(course.id, allSessionIds);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    amount = calculateOrderTotal({
      usesSessions: true,
      courseFee: course.fee,
      students,
      sessionPriceMap,
      defaultUnitPrice: plan?.defaultUnitPrice ?? course.fee,
    });

    enrichedFormData = {
      ...enrichedFormData,
      sessionIds: allSessionIds,
      sessionSummaries: validation.data.sessionSummaries,
      unitPrice:
        allSessionIds.length > 0
          ? Math.round(amount / allSessionIds.length)
          : course.fee,
    };
  } else if (!usesSessions && course.isFull) {
    return { success: false, error: "此課程已額滿" };
  }

  const availableMethods = resolveAvailablePaymentMethods({
    allowedMethods: course.allowedPaymentMethods,
    totalAmount: amount,
  });

  if (!availableMethods.includes(input.paymentMethod)) {
    return { success: false, error: "此課程不支援所選付款方式" };
  }

  if (input.paymentMethod === "ecpay" && !isEcpayConfigured()) {
    console.error(
      "ECPay not configured: missing ECPAY_MERCHANT_ID, ECPAY_HASH_KEY, or ECPAY_HASH_IV",
    );
    return { success: false, error: "金流尚未設定，請聯絡管理員" };
  }

  const merchantTradeNo = generateMerchantTradeNo();
  const paymentStatus =
    input.paymentMethod === "bank_transfer" ? "waiting_transfer" : "pending";

  const { order, error } = await createOrder({
    merchantTradeNo,
    courseId: course.id,
    courseTitle: course.title,
    amount,
    formData: enrichedFormData,
    paymentMethod: input.paymentMethod,
    paymentStatus:
      input.paymentMethod === "free" ? "pending" : paymentStatus,
  });

  if (!order) {
    return { success: false, error: error ?? "建立訂單失敗" };
  }

  if (input.paymentMethod === "free") {
    const fulfillment = await fulfillOrderById(order.id);
    if (!fulfillment.success) {
      return { success: false, error: fulfillment.error };
    }

    return {
      success: true,
      orderId: order.id,
      redirectPath: getRedirectPath(order.id, "free"),
      paymentMethod: "free",
    };
  }

  return {
    success: true,
    orderId: order.id,
    redirectPath: getRedirectPath(order.id, input.paymentMethod),
    paymentMethod: input.paymentMethod,
  };
}
