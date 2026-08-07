import { z } from "zod";
import { SUPPORTED_MEDIA_TYPES } from "@/lib/media/types";
import { isSupportedMediaSource } from "@/lib/media/providers";

export const courseMediaSchema = z.object({
  id: z.string().uuid().optional(),
  courseId: z.string().uuid("請提供有效的課程 ID"),
  mediaType: z.enum(SUPPORTED_MEDIA_TYPES).default("youtube"),
  title: z.string().trim().min(1, "請填寫標題"),
  sourceUrl: z.string().trim().min(1, "請填寫 YouTube 網址"),
  sortOrder: z.coerce.number().int().min(0, "排序不可為負數").default(0),
  isVisible: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (!isSupportedMediaSource(data.mediaType, data.sourceUrl)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "請填寫有效的 YouTube 網址",
      path: ["sourceUrl"],
    });
  }
});

export type CourseMediaFormValues = z.infer<typeof courseMediaSchema>;
