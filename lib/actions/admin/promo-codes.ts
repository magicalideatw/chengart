"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import type { AdminActionResult } from "@/lib/admin/types";
import type { DiscountType } from "@/lib/pricing/types";
import { deletePromoCode, savePromoCode, getPromoCodesByCourseId } from "@/lib/promo/queries";
import { promoCodeSchema } from "@/lib/validation/promo-code-schema";

export async function savePromoCodeAction(
  input: {
    id?: string;
    courseId: string;
    name: string;
    code: string;
    validFrom: string;
    validUntil: string;
    discountType: DiscountType;
    discountValue: number;
    maxUses: number | null;
    maxUsesPerPerson: number | null;
    isActive: boolean;
  },
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = promoCodeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const result = await savePromoCode(parsed.data);
  if (!result.success) {
    return { success: false, error: result.error ?? "儲存失敗" };
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/courses/${input.courseId}`);
  return { success: true };
}

export async function deletePromoCodeAction(
  promoCodeId: string,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const result = await deletePromoCode(promoCodeId);
  if (!result.success) {
    return { success: false, error: result.error ?? "刪除失敗" };
  }

  revalidatePath("/admin/courses");
  return { success: true };
}

export async function getPromoCodesForCourseAction(courseId: string) {
  await requireAuthenticatedUser();
  return getPromoCodesByCourseId(courseId);
}
