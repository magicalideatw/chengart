"use server";

import { generateMerchantTradeNo, isEcpayConfigured } from "@/lib/ecpay/config";
import { getCourseWithEnrollment } from "@/lib/courses/queries";
import { isBeforeRegistrationDeadline } from "@/lib/courses/enrollment";
import {
  notifyAdminNewOrder,
  notifyParentBankTransferPending,
} from "@/lib/email/dispatch";
import { createOrder, getOrderById } from "@/lib/orders/queries";
import { fulfillOnSiteOrderById, fulfillOrderById } from "@/lib/payment/fulfill-order";
import type { PaymentMethod } from "@/lib/payment/types";
import {
  isPaymentMethod,
  resolveAvailablePaymentMethods,
} from "@/lib/payment/types";
import {
  calculateRegistrationPricing,
  courseToPricingRules,
} from "@/lib/pricing/engine";
import { validatePromoCode } from "@/lib/actions/pricing";
import { recordPromoCodeRedemption } from "@/lib/promo/queries";
import { getEffectivePricePerStudent, countRegistrationSessionSlots } from "@/lib/registration/pricing";
import {
  getCourseRegistrationPlan,
  validateSessionSelection,
  validateCoursePlanSelection,
  buildCoursePlanSessionSummary,
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
    case "on_site":
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

  if (!isBeforeRegistrationDeadline(course)) {
    return { success: false, error: "此課程報名已截止" };
  }

  const orderFormData: RegistrationOrderFormData = parsed.data;
  const students = normalizeStudentsFromFormData(orderFormData);

  if (students.length === 0) {
    return { success: false, error: "請至少新增一位學生" };
  }

  const plan = await getCourseRegistrationPlan(course.id);
  const usesSessions = plan?.usesSessions ?? false;
  const usesCoursePlans = plan?.usesCoursePlans ?? false;
  const coursePlanId = orderFormData.coursePlanId;

  if (usesCoursePlans) {
    if (!coursePlanId) {
      return { success: false, error: "請選擇課程方案" };
    }
  } else if (usesSessions) {
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

  let selectedCoursePlan = null;
  if (usesCoursePlans && coursePlanId) {
    const planResult = await validateCoursePlanSelection(course.id, coursePlanId);
    if (!planResult.success) {
      return { success: false, error: planResult.error };
    }
    selectedCoursePlan = planResult.data.plan;
  }

  const sessionSlotCount =
    usesCoursePlans && selectedCoursePlan
      ? selectedCoursePlan.sessionCount * students.length
      : countRegistrationSessionSlots(students, { usesSessions });

  const pricingRules = courseToPricingRules(course);
  const basePricePerStudent = getEffectivePricePerStudent(course);
  let promoCodeRecord = null;

  const packagePricePerStudent =
    usesCoursePlans && selectedCoursePlan ? selectedCoursePlan.price : undefined;

  if (
    (packagePricePerStudent ?? basePricePerStudent) > 0 &&
    orderFormData.promoCode?.trim()
  ) {
    const promoResult = await validatePromoCode({
      courseId: course.id,
      code: orderFormData.promoCode,
      studentCount: students.length,
      sessionSlotCount,
      email: orderFormData.email,
      packagePricePerStudent,
    });

    if (!promoResult.success) {
      return { success: false, error: promoResult.error };
    }

    promoCodeRecord = promoResult.promo;
  }

  const pricing = calculateRegistrationPricing({
    course: pricingRules,
    studentCount: students.length,
    sessionSlotCount,
    promoCode: promoCodeRecord,
    packagePricePerStudent,
  });

  const amount = pricing.total;

  let enrichedFormData: RegistrationOrderFormData = {
    ...orderFormData,
    students,
    paymentMethod: input.paymentMethod,
    unitPrice: pricing.basePricePerStudent,
    promoCode: pricing.promoCode ?? undefined,
    pricingSnapshot: pricing,
    ...(selectedCoursePlan
      ? {
          coursePlanId: selectedCoursePlan.id,
          coursePlanName: buildCoursePlanSessionSummary(selectedCoursePlan),
          coursePlanSessionCount: selectedCoursePlan.sessionCount,
        }
      : {}),
  };

  if ((usesSessions || usesCoursePlans) && allSessionIds.length > 0) {
    const validation = await validateSessionSelection(course.id, allSessionIds);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    enrichedFormData = {
      ...enrichedFormData,
      sessionIds: allSessionIds,
      sessionSummaries: selectedCoursePlan
        ? [buildCoursePlanSessionSummary(selectedCoursePlan)]
        : validation.data.sessionSummaries,
    };
  } else if (!usesSessions && course.isFull) {
    return { success: false, error: "此課程已額滿" };
  }

  const availableMethods = resolveAvailablePaymentMethods({
    allowedMethods: course.allowedPaymentMethods,
    totalAmount: amount,
  });

  if (input.paymentMethod === "on_site") {
    if (amount <= 0) {
      return { success: false, error: "免費課程不需選擇現場繳費" };
    }
  } else if (!availableMethods.includes(input.paymentMethod)) {
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
    subtotal: pricing.subtotal,
    discountTotal: pricing.discountTotal,
    promoCode: pricing.promoCode,
    pricingSnapshot: pricing,
    formData: enrichedFormData,
    paymentMethod: input.paymentMethod,
    paymentStatus:
      input.paymentMethod === "free" ? "pending" : paymentStatus,
  });

  if (!order) {
    return { success: false, error: error ?? "建立訂單失敗" };
  }

  if (pricing.promoCodeId) {
    await recordPromoCodeRedemption({
      promoCodeId: pricing.promoCodeId,
      orderId: order.id,
      email: order.email,
    });
  }

  if (input.paymentMethod !== "free") {
    void notifyAdminNewOrder({ order, course }).catch((emailError) => {
      console.error("Admin new order email failed:", emailError);
    });
  }

  if (input.paymentMethod === "bank_transfer") {
    void notifyParentBankTransferPending({ order, course }).catch((emailError) => {
      console.error("Bank transfer pending email failed:", emailError);
    });
  }

  if (input.paymentMethod === "free") {
    const fulfillment = await fulfillOrderById(order.id);
    if (!fulfillment.success) {
      return { success: false, error: fulfillment.error };
    }

    const paidOrder = await getOrderById(order.id);
    if (paidOrder) {
      void notifyAdminNewOrder({ order: paidOrder, course }).catch((emailError) => {
        console.error("Admin new order email failed:", emailError);
      });
    }

    return {
      success: true,
      orderId: order.id,
      redirectPath: getRedirectPath(order.id, "free"),
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
      redirectPath: getRedirectPath(order.id, "on_site"),
      paymentMethod: "on_site",
    };
  }

  return {
    success: true,
    orderId: order.id,
    redirectPath: getRedirectPath(order.id, input.paymentMethod),
    paymentMethod: input.paymentMethod,
  };
}
