import { z } from "zod";
import { EVENT_STATUSES, EVENT_TYPES } from "@/lib/events/constants";

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || z.string().url().safeParse(value).success, {
    message: "請輸入有效的網址",
  });

export const adminEventSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "請填寫網址代稱")
    .max(80, "網址代稱過長")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "網址代稱只能使用小寫英文、數字與連字號"),
  title: z.string().trim().min(1, "請填寫標題"),
  subtitle: z.string().trim(),
  coverImage: z.string().trim().min(1, "請上傳封面圖片"),
  eventType: z
    .string()
    .min(1, "請選擇活動類型")
    .refine(
      (value) => EVENT_TYPES.includes(value as (typeof EVENT_TYPES)[number]),
      { message: "請選擇活動類型" },
    ),
  status: z.enum(EVENT_STATUSES, { message: "請選擇狀態" }),
  startDate: z.string().min(1, "請填寫開始日期"),
  endDate: z.string(),
  intro: z.string().trim(),
  content: z.string(),
  showOnHomepage: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.coerce.number().int(),
  registrationButtonText: z.string().trim().min(1, "請填寫報名按鈕文字"),
  registrationUrl: optionalUrl,
});

export type AdminEventFormValues = z.infer<typeof adminEventSchema>;
