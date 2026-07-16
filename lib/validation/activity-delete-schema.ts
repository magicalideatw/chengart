import { z } from "zod";

export const ACTIVITY_DELETE_CONFIRMATION = "DELETE" as const;

export const archiveActivitySchema = z.object({
  courseId: z.string().uuid("無效的活動 ID"),
});

export const deleteActivityCascadeSchema = z.object({
  courseId: z.string().uuid("無效的活動 ID"),
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === ACTIVITY_DELETE_CONFIRMATION, {
      message: `請輸入 ${ACTIVITY_DELETE_CONFIRMATION} 以確認永久刪除`,
    }),
});

export const archiveActivitiesBatchSchema = z.object({
  courseIds: z.array(z.string().uuid("無效的活動 ID")).min(1, "請至少選擇一個活動"),
});

export const deleteActivitiesBatchSchema = z.object({
  courseIds: z.array(z.string().uuid("無效的活動 ID")).min(1, "請至少選擇一個活動"),
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === ACTIVITY_DELETE_CONFIRMATION, {
      message: `請輸入 ${ACTIVITY_DELETE_CONFIRMATION} 以確認永久刪除`,
    }),
});
