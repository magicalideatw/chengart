import { z } from "zod";

export const bankTransferSettingsSchema = z.object({
  bankName: z.string().min(1, "請填寫銀行名稱"),
  bankCode: z.string().min(1, "請填寫銀行代碼"),
  accountNumber: z.string().min(1, "請填寫帳號"),
  accountName: z.string().min(1, "請填寫戶名"),
  transferDeadlineDays: z.coerce.number().int().min(1, "匯款期限至少 1 天"),
  reminderText: z.string().min(1, "請填寫提醒文字"),
});

export type BankTransferSettingsFormValues = z.infer<
  typeof bankTransferSettingsSchema
>;
