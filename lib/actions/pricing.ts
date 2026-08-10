"use server";

import {
  calculateRegistrationPricing,
  courseToPricingRules,
  isPromoCodeDateValid,
} from "@/lib/pricing/engine";
import type { PricingSnapshot, PromoCodeRecord } from "@/lib/pricing/types";
import { getCourseById } from "@/lib/courses/queries";
import { getEffectivePricePerStudent } from "@/lib/registration/pricing";
import {
  countPromoRedemptionsByEmail,
  findPromoCodeByCode,
} from "@/lib/promo/queries";

export type ValidatePromoCodeResult =
  | { success: true; promo: PromoCodeRecord; pricing: PricingSnapshot }
  | { success: false; error: string };

export async function validatePromoCode(input: {
  courseId: string;
  code: string;
  studentCount: number;
  sessionSlotCount?: number;
  email?: string;
  packagePricePerStudent?: number;
}): Promise<ValidatePromoCodeResult> {
  const course = await getCourseById(input.courseId);

  if (!course) {
    return { success: false, error: "找不到此課程" };
  }

  const pricingRules = courseToPricingRules(course);
  const packagePrice = input.packagePricePerStudent;
  const basePrice = getEffectivePricePerStudent(pricingRules);

  if ((packagePrice ?? basePrice) <= 0) {
    return { success: false, error: "免費活動不適用折扣碼" };
  }

  const promo = await findPromoCodeByCode({
    courseId: input.courseId,
    code: input.code,
  });

  if (!promo) {
    return { success: false, error: "找不到此折扣碼" };
  }

  if (!promo.isActive) {
    return { success: false, error: "此折扣碼已停用" };
  }

  if (!isPromoCodeDateValid(promo)) {
    return { success: false, error: "此折扣碼不在有效期間內" };
  }

  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    return { success: false, error: "此折扣碼已達使用上限" };
  }

  if (promo.maxUsesPerPerson != null && input.email?.trim()) {
    const usedByPerson = await countPromoRedemptionsByEmail({
      promoCodeId: promo.id,
      email: input.email,
    });

    if (usedByPerson >= promo.maxUsesPerPerson) {
      return { success: false, error: "您已達此折扣碼的使用上限" };
    }
  }

  const pricing = calculateRegistrationPricing({
    course: pricingRules,
    studentCount: input.studentCount,
    sessionSlotCount: input.sessionSlotCount,
    promoCode: promo,
    packagePricePerStudent: packagePrice,
  });

  if (pricing.total === pricing.subtotal) {
    return { success: false, error: "此折扣碼無法套用" };
  }

  return { success: true, promo, pricing };
}

export async function previewRegistrationPricing(input: {
  courseId: string;
  studentCount: number;
  sessionSlotCount?: number;
  promoCode?: string;
  email?: string;
}): Promise<
  | { success: true; pricing: PricingSnapshot }
  | { success: false; error: string }
> {
  const course = await getCourseById(input.courseId);

  if (!course) {
    return { success: false, error: "找不到此課程" };
  }

  const pricingRules = courseToPricingRules(course);
  let promo: PromoCodeRecord | null = null;

  if (input.promoCode?.trim()) {
    const validated = await validatePromoCode({
      courseId: input.courseId,
      code: input.promoCode,
      studentCount: input.studentCount,
      sessionSlotCount: input.sessionSlotCount,
      email: input.email,
    });

    if (!validated.success) {
      return validated;
    }

    promo = validated.promo;
  }

  return {
    success: true,
    pricing: calculateRegistrationPricing({
      course: pricingRules,
      studentCount: input.studentCount,
      sessionSlotCount: input.sessionSlotCount,
      promoCode: promo,
    }),
  };
}
