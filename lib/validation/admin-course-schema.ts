import { z } from "zod";
import { COURSE_CATEGORIES } from "@/lib/courses/types";
import { REGISTRATION_MODES } from "@/lib/courses/registration-mode";
import { PAYMENT_METHODS } from "@/lib/payment/types";

export const adminCourseSchema = z.object({
  title: z.string().min(1, "請填寫課程名稱"),
  category: z
    .string()
    .min(1, "請選擇課程分類")
    .refine(
      (value) => COURSE_CATEGORIES.includes(value as (typeof COURSE_CATEGORIES)[number]),
      { message: "請選擇課程分類" },
    ),
  description: z.string().min(1, "請填寫課程介紹"),
  sessionDate: z.string().min(1, "請填寫上課日期"),
  sessionTime: z.string().min(1, "請填寫上課時間"),
  capacity: z.coerce.number().int().min(1, "名額至少為 1"),
  fee: z.coerce.number().int().min(0, "費用不可為負數"),
  coverImage: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((value) => !value || !/^https?:\/\//i.test(value), {
      message: "請上傳圖片，不可使用外部網址",
    }),
  isOpen: z.boolean(),
  allowedPaymentMethods: z
    .array(z.enum(PAYMENT_METHODS))
    .min(1, "請至少選擇一種付款方式"),
  registrationMode: z.enum(REGISTRATION_MODES),
  pricePerStudent: z.coerce.number().int().min(0, "每位學生價格不可為負數"),
});

export type AdminCourseFormValues = z.infer<typeof adminCourseSchema>;
