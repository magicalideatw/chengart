import type { DiscountType, PromoCodeRecord } from "@/lib/pricing/types";
import { createPaymentClient, createServerClient, isSupabaseConfigured } from "@/lib/supabase";

function parseDiscountType(value: unknown): DiscountType {
  return value === "percent" ? "percent" : "fixed";
}

function mapPromoCodeRow(row: Record<string, unknown>): PromoCodeRecord {
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    name: String(row.name),
    code: String(row.code),
    validFrom: row.valid_from ? String(row.valid_from) : null,
    validUntil: row.valid_until ? String(row.valid_until) : null,
    discountType: parseDiscountType(row.discount_type),
    discountValue: Number(row.discount_value ?? 0),
    maxUses: row.max_uses == null ? null : Number(row.max_uses),
    usedCount: Number(row.used_count ?? 0),
    maxUsesPerPerson: row.max_uses_per_person == null
      ? null
      : Number(row.max_uses_per_person),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getPromoCodesByCourseId(
  courseId: string,
): Promise<PromoCodeRecord[]> {
  if (!isSupabaseConfigured() || !courseId) return [];

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code !== "PGRST205") {
      console.error("Failed to fetch promo codes:", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) => mapPromoCodeRow(row));
}

export async function courseHasPromoCodes(courseId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !courseId) return false;

  const supabase = await createServerClient();
  const { count, error } = await supabase
    .from("promo_codes")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)
    .eq("is_active", true);

  if (error) {
    if (error.code !== "PGRST205") {
      console.error("Failed to count promo codes:", error.message);
    }
    return false;
  }

  return (count ?? 0) > 0;
}

export async function findPromoCodeByCode(input: {
  courseId: string;
  code: string;
}): Promise<PromoCodeRecord | null> {
  if (!isSupabaseConfigured() || !input.courseId || !input.code.trim()) {
    return null;
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("course_id", input.courseId)
    .eq("code", input.code.trim().toUpperCase())
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapPromoCodeRow(data);
}

export async function countPromoRedemptionsByEmail(input: {
  promoCodeId: string;
  email: string;
}): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const supabase = await createServerClient();
  const { count, error } = await supabase
    .from("promo_code_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("promo_code_id", input.promoCodeId)
    .eq("email", input.email.trim().toLowerCase());

  if (error) {
    if (error.code !== "PGRST205") {
      console.error("Failed to count promo redemptions:", error.message);
    }
    return 0;
  }

  return count ?? 0;
}

export async function recordPromoCodeRedemption(input: {
  promoCodeId: string;
  orderId: string;
  email: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createPaymentClient();

  await supabase.from("promo_code_redemptions").insert({
    promo_code_id: input.promoCodeId,
    order_id: input.orderId,
    email: input.email.trim().toLowerCase(),
  });

  const { data } = await supabase
    .from("promo_codes")
    .select("used_count")
    .eq("id", input.promoCodeId)
    .maybeSingle();

  const usedCount = Number(data?.used_count ?? 0) + 1;

  await supabase
    .from("promo_codes")
    .update({
      used_count: usedCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.promoCodeId);
}

export async function savePromoCode(input: {
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
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const supabase = await createServerClient();
  const payload = {
    course_id: input.courseId,
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    valid_from: input.validFrom.trim() || null,
    valid_until: input.validUntil.trim() || null,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    max_uses: input.maxUses,
    max_uses_per_person: input.maxUsesPerPerson,
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase
      .from("promo_codes")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      console.error("Failed to update promo code:", error.message);
      return { success: false, error: "更新折扣碼失敗" };
    }

    return { success: true };
  }

  const { error } = await supabase.from("promo_codes").insert(payload);

  if (error) {
    console.error("Failed to create promo code:", error.message);
    if (error.code === "23505") {
      return { success: false, error: "此折扣碼已存在" };
    }
    return { success: false, error: "建立折扣碼失敗" };
  }

  return { success: true };
}

export async function deletePromoCode(
  promoCodeId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("promo_codes").delete().eq("id", promoCodeId);

  if (error) {
    console.error("Failed to delete promo code:", error.message);
    return { success: false, error: "刪除折扣碼失敗" };
  }

  return { success: true };
}
