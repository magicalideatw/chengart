import { z } from "zod";
import { SESSION_STATUSES, SESSION_TYPES } from "@/lib/sessions/types";

const baseSessionFields = {
  sessionType: z.enum(SESSION_TYPES),
  name: z.string().trim().min(1, "請填寫名稱"),
  date: z.string().trim(),
  startTime: z.string().trim(),
  endTime: z.string().trim(),
  capacity: z.coerce.number().int().min(1, "名額至少為 1"),
  remainingCapacity: z.coerce.number().int().min(0, "剩餘名額不可為負數"),
  price: z.coerce.number().int().min(0, "價格不可為負數"),
  location: z.string().trim(),
  isOpen: z.boolean(),
  sortOrder: z.coerce.number().int().min(0, "排序不可為負數"),
  status: z.enum(SESSION_STATUSES),
  notes: z.string().trim(),
};

export const adminSessionSchema = z
  .object(baseSessionFields)
  .superRefine((data, ctx) => {
    if (data.remainingCapacity > data.capacity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "剩餘名額不可大於容量",
        path: ["remainingCapacity"],
      });
    }

    if (data.sessionType !== "fixed") return;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "請選擇有效日期",
        path: ["date"],
      });
    }

    if (!data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "請填寫開始時間",
        path: ["startTime"],
      });
    }

    if (!data.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "請填寫結束時間",
        path: ["endTime"],
      });
    }
  });

export type AdminSessionFormValues = z.infer<typeof adminSessionSchema>;

export const adminSessionBulkSchema = z
  .object({
    weekday: z.string().trim().min(1, "請選擇星期"),
    startDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "請選擇有效開始日期"),
    endDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "請選擇有效結束日期"),
    name: z.string().trim().optional(),
    startTime: z.string().trim().optional(),
    endTime: z.string().trim().optional(),
    capacity: z.coerce.number().int().min(1).optional(),
    price: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "結束日期不可早於開始日期",
    path: ["endDate"],
  });

export type AdminSessionBulkFormValues = z.infer<typeof adminSessionBulkSchema>;
