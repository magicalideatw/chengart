import { z } from "zod";
import { WEEKDAYS } from "@/lib/classes/types";

export const adminClassSchema = z.object({
  name: z.string().trim().min(1, "請填寫班別名稱"),
  teacher: z.string().trim(),
  weekday: z
    .string()
    .min(1, "請選擇星期")
    .refine(
      (value) => WEEKDAYS.includes(value as (typeof WEEKDAYS)[number]),
      { message: "請選擇有效的星期" },
    ),
  startTime: z.string().trim().min(1, "請填寫開始時間"),
  endTime: z.string().trim().min(1, "請填寫結束時間"),
  capacity: z.coerce.number().int().min(1, "名額至少為 1"),
  fee: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }, z.number().int().min(0, "費用不可為負數").nullable()),
  isOpen: z.boolean(),
  sortOrder: z.coerce.number().int(),
});

export type AdminClassFormValues = z.infer<typeof adminClassSchema>;
