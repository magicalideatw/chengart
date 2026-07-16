import { z } from "zod";

export const transferReportSchema = z.object({
  orderId: z.string().uuid("訂單編號有誤"),
  transferLast5: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "請輸入帳號後五碼（5 位數字）"),
  transferDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "請選擇匯款日期"),
  transferTime: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "請選擇匯款時間"),
  transferNote: z.string().trim().max(500, "備註不可超過 500 字").optional(),
});

export type TransferReportInput = z.infer<typeof transferReportSchema>;
