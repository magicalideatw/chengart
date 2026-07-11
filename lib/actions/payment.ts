"use server";

import { generateMerchantTradeNo, isEcpayConfigured } from "@/lib/ecpay/config";
import { getCourseWithEnrollment } from "@/lib/courses/queries";
import { createPendingOrder } from "@/lib/orders/queries";
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
};

export type CreateRegistrationOrderResult =
  | { success: true; orderId: string; checkoutPath: string }
  | { success: false; error: string };

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

  if (!isEcpayConfigured()) {
    console.error("ECPay not configured: missing ECPAY_MERCHANT_ID, ECPAY_HASH_KEY, or ECPAY_HASH_IV");
    return { success: false, error: "金流尚未設定，請聯絡管理員" };
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
  } else {
    if (course.isFull) {
      return { success: false, error: "此課程已額滿" };
    }

    if (course.fee <= 0) {
      return { success: false, error: "此課程費用設定有誤，請聯絡管理員" };
    }
  }

  if (amount <= 0) {
    return { success: false, error: "此課程費用設定有誤，請聯絡管理員" };
  }

  const merchantTradeNo = generateMerchantTradeNo();
  const { order, error } = await createPendingOrder({
    merchantTradeNo,
    courseId: course.id,
    courseTitle: course.title,
    amount,
    formData: enrichedFormData,
  });

  if (!order) {
    return { success: false, error: error ?? "建立訂單失敗" };
  }

  return {
    success: true,
    orderId: order.id,
    checkoutPath: `/payment/checkout/${order.id}`,
  };
}
