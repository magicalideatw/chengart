import { z } from "zod";
import { COURSE_CATEGORIES } from "@/lib/courses/types";
import { REGISTRATION_MODES } from "@/lib/courses/registration-mode";
import { ACTIVITY_TYPES } from "@/lib/courses/activity-type";
import { PARTICIPATION_METHODS } from "@/lib/courses/participation-method";
import { DISCOUNT_TYPES } from "@/lib/pricing/types";
import { CHECKOUT_PAYMENT_METHODS } from "@/lib/payment/types";
import { SESSION_TYPES } from "@/lib/sessions/types";

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
    activityType: z.enum(ACTIVITY_TYPES).default("course"),
    activityRules: z.string().trim().optional().default(""),
    participationMethod: z.enum(PARTICIPATION_METHODS).default("internal"),
    externalUrl: z.string().trim().optional().default(""),
    actionButtonText: z.string().trim().optional().default(""),
    isOpen: z.boolean().default(true),
    scheduleMode: z.enum(SESSION_TYPES).default("fixed"),
    sessionDate: z.string().trim().default(""),
    sessionStartTime: z.string().trim().default(""),
    sessionEndTime: z.string().trim().default(""),
    sessionTime: z.string().trim().default(""),
    capacity: z.coerce.number().int().min(1, "名額至少為 1"),
    coverImage: z
      .string()
      .trim()
      .optional()
      .default("")
      .refine((value) => !value || !/^https?:\/\//i.test(value), {
        message: "請上傳圖片，不可使用外部網址",
      }),
    allowedPaymentMethods: z.array(z.enum(CHECKOUT_PAYMENT_METHODS)).default([]),
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
    earlyBirdEnabled: z.boolean().default(false),
    earlyBirdDeadline: z.string().trim().optional().default(""),
    earlyBirdDiscountType: z.enum(DISCOUNT_TYPES).nullable().optional().default(null),
    earlyBirdDiscountValue: z.coerce.number().int().min(0).default(0),
    groupDiscountEnabled: z.boolean().default(false),
    groupDiscountMinStudents: z
      .union([z.coerce.number().int().min(2), z.literal(""), z.null()])
      .optional()
      .transform((value) => {
        if (value === "" || value == null) return null;
        return value;
      }),
    groupDiscountType: z.enum(DISCOUNT_TYPES).nullable().optional().default(null),
    groupDiscountValue: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((data, ctx) => {
    if (data.activityType === "course" && data.scheduleMode === "fixed") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.sessionDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "請填寫上課日期",
          path: ["sessionDate"],
        });
      }

      if (!data.sessionStartTime.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "請填寫開始時間",
          path: ["sessionStartTime"],
        });
      }

      if (!data.sessionEndTime.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "請填寫結束時間",
          path: ["sessionEndTime"],
        });
      }
    }

    if (data.participationMethod === "external") {
      if (!data.externalUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "請填寫外部網址",
          path: ["externalUrl"],
        });
      } else {
        try {
          const url = new URL(data.externalUrl);
          if (url.protocol !== "http:" && url.protocol !== "https:") {
            throw new Error("invalid protocol");
          }
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "請填寫有效的外部網址（http:// 或 https://）",
            path: ["externalUrl"],
          });
        }
      }
    }

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

    if (data.pricePerStudent > 0 && data.earlyBirdEnabled) {
      if (!data.earlyBirdDeadline) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "請設定早鳥截止日期",
          path: ["earlyBirdDeadline"],
        });
      }
      if (!data.earlyBirdDiscountType || data.earlyBirdDiscountValue <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "請設定早鳥折扣",
          path: ["earlyBirdDiscountValue"],
        });
      }
    }

    if (data.pricePerStudent > 0 && data.groupDiscountEnabled) {
      if (!data.groupDiscountMinStudents) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "請設定團報人數門檻",
          path: ["groupDiscountMinStudents"],
        });
      }
      if (!data.groupDiscountType || data.groupDiscountValue <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "請設定團報折扣",
          path: ["groupDiscountValue"],
        });
      }
    }
  });

export type AdminCourseFormValues = z.infer<typeof adminCourseSchema>;
