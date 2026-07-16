"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import type { AdminActionResult } from "@/lib/admin/types";
import {
  saveBankTransferSettings,
  saveEmailSettings,
} from "@/lib/settings/queries";
import type { BankTransferSettings, EmailSettings } from "@/lib/settings/types";
import {
  bankTransferSettingsSchema,
  emailSettingsSchema,
} from "@/lib/validation/admin-settings-schema";

export async function updateBankTransferSettings(
  input: BankTransferSettings,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = bankTransferSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const result = await saveBankTransferSettings(parsed.data);
  if (!result.success) {
    return { success: false, error: result.error ?? "儲存失敗" };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateEmailSettings(
  input: EmailSettings,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = emailSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const result = await saveEmailSettings(parsed.data);
  if (!result.success) {
    return { success: false, error: result.error ?? "儲存失敗" };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
