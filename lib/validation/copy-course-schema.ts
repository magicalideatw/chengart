import { z } from "zod";

export const copyCourseSchema = z.object({
  sourceCourseId: z.string().uuid("來源課程有誤"),
  title: z.string().trim().min(1, "請填寫活動名稱"),
  copyIntro: z.boolean(),
  copyCoverImage: z.boolean(),
  copySessions: z.boolean(),
  copyPricing: z.boolean(),
  copyRegistrationSettings: z.boolean(),
  copyPaymentMethods: z.boolean(),
});

export type CopyCourseInput = z.infer<typeof copyCourseSchema>;
