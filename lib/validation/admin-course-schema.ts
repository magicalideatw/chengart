import { z } from "zod";
import { COURSE_CATEGORIES } from "@/lib/courses/types";
import { REGISTRATION_MODES } from "@/lib/courses/registration-mode";
import { PAID_PAYMENT_METHODS } from "@/lib/payment/types";

export const adminCourseSchema = z
  .object({
    title: z.string().min(1, "請填寫課程名稱"),
    category: z
      .string()
      .min(1, "請選擇課程分類")
      .refine(
        (value) =>
          COURSE_CATEGORIES.includes(value as (typeof COURSE_CATEGORIES)[number]),
        { message: "請選擇課程分類" },
      ),
    description: z.string().min(1, "請填寫課程介紹"),
    courseDetails: z.string().trim().optional().default(""),
    sessionDate: z.string().min(1, "請填寫上課日期"),
    sessionTime: z.string().min(1, "請填寫上課時間"),
    capacity: z.coerce.number().int().min(1, "名額至少為 1"),
    coverImage: z
      .string()
      .trim()
      .optional()
      .default("")
      .refine((value) => !value || !/^https?:\/\//i.test(value), {
        message: "請上傳圖片，不可使用外部網址",
      }),
    isOpen: z.boolean(),
    allowedPaymentMethods: z.array(z.enum(PAID_PAYMENT_METHODS)).default([]),
    registrationMode: z.enum(REGISTRATION_MODES),
    pricePerStudent: z.coerce.number().int().min(0, "每人價格不可為負數"),
    registrationDeadline: z.string().trim().optional().default(""),
    showRemainingCapacity: z.boolean().default(true),
    transferDeadlineDays: z
      .union([z.coerce.number().int().min(1), z.literal(""), z.null()])
      .optional()
      .transform((value) => {
        if (value === "" || value == null) return null;
        return value;
      }),
  })
  .superRefine((data, ctx) => {
    if (data.pricePerStudent > 0 && data.allowedPaymentMethods.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "付費課程請至少選擇一種付款方式",
        path: ["allowedPaymentMethods"],
      });
    }

    if (
      data.pricePerStudent > 0 &&
      data.allowedPaymentMethods.includes("bank_transfer") &&
      !data.transferDeadlineDays
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "請設定銀行轉帳匯款期限",
        path: ["transferDeadlineDays"],
      });
    }
  });

export type AdminCourseFormValues = z.infer<typeof adminCourseSchema>;
