"use server";

import { generateMerchantTradeNo, isEcpayConfigured } from "@/lib/ecpay/config";
import { getCourseWithEnrollment } from "@/lib/courses/queries";
import { createPendingOrder } from "@/lib/orders/queries";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  registrationFormSchema,
  type RegistrationFormValues,
} from "@/lib/validation/registration-schema";

export type CreateRegistrationOrderInput = {
  courseId: string;
  formData: RegistrationFormValues;
};

export type CreateRegistrationOrderResult =
  | { success: true; orderId: string; checkoutPath: string }
  | { success: false; error: string };

export async function createRegistrationOrder(
  input: CreateRegistrationOrderInput,
): Promise<CreateRegistrationOrderResult> {
  const parsed = registrationFormSchema.safeParse(input.formData);

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

  if (course.isFull) {
    return { success: false, error: "此課程已額滿" };
  }

  if (course.fee <= 0) {
    return { success: false, error: "此課程費用設定有誤，請聯絡管理員" };
  }

  const merchantTradeNo = generateMerchantTradeNo();
  const { order, error } = await createPendingOrder({
    merchantTradeNo,
    courseId: course.id,
    courseTitle: course.title,
    amount: course.fee,
    formData: parsed.data,
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
