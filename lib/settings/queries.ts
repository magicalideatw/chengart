import {
  DEFAULT_BANK_TRANSFER_SETTINGS,
  SYSTEM_SETTING_KEYS,
  type BankTransferSettings,
} from "@/lib/settings/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

function parseBankTransferSettings(value: unknown): BankTransferSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_BANK_TRANSFER_SETTINGS;
  }

  const record = value as Record<string, unknown>;

  return {
    bankName:
      typeof record.bankName === "string"
        ? record.bankName
        : DEFAULT_BANK_TRANSFER_SETTINGS.bankName,
    bankCode:
      typeof record.bankCode === "string"
        ? record.bankCode
        : DEFAULT_BANK_TRANSFER_SETTINGS.bankCode,
    accountNumber:
      typeof record.accountNumber === "string"
        ? record.accountNumber
        : DEFAULT_BANK_TRANSFER_SETTINGS.accountNumber,
    accountName:
      typeof record.accountName === "string"
        ? record.accountName
        : DEFAULT_BANK_TRANSFER_SETTINGS.accountName,
    transferDeadlineDays:
      typeof record.transferDeadlineDays === "number" &&
      record.transferDeadlineDays > 0
        ? record.transferDeadlineDays
        : DEFAULT_BANK_TRANSFER_SETTINGS.transferDeadlineDays,
    reminderText:
      typeof record.reminderText === "string"
        ? record.reminderText
        : DEFAULT_BANK_TRANSFER_SETTINGS.reminderText,
  };
}

export async function getBankTransferSettings(): Promise<BankTransferSettings> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_BANK_TRANSFER_SETTINGS;
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", SYSTEM_SETTING_KEYS.bankTransfer)
    .maybeSingle();

  if (error || !data?.value) {
    return DEFAULT_BANK_TRANSFER_SETTINGS;
  }

  return parseBankTransferSettings(data.value);
}

export async function saveBankTransferSettings(
  settings: BankTransferSettings,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("system_settings").upsert(
    {
      key: SYSTEM_SETTING_KEYS.bankTransfer,
      value: settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    console.error("Failed to save bank transfer settings:", error.message);
    return { success: false, error: "儲存設定失敗" };
  }

  return { success: true };
}
