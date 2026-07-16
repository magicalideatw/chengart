import { z } from "zod";

export const copyEventSchema = z.object({
  sourceEventId: z.string().uuid("來源活動有誤"),
  title: z.string().trim().min(1, "請填寫活動名稱"),
  slug: z
    .string()
    .trim()
    .min(1, "請填寫網址代稱")
    .max(80, "網址代稱過長")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "網址代稱只能使用小寫英文、數字與連字號"),
  copyIntro: z.boolean(),
  copyCoverImage: z.boolean(),
  copySessions: z.boolean(),
  copyPricing: z.boolean(),
  copyRegistrationSettings: z.boolean(),
  copyPaymentMethods: z.boolean(),
});

export type CopyEventInput = z.infer<typeof copyEventSchema>;
