import { z } from "zod";

export const coursePlanSchema = z.object({
  name: z.string().trim().min(1, "請填寫方案名稱"),
  sessionCount: z.coerce.number().int().min(1, "堂數至少為 1"),
  price: z.coerce.number().int().min(0, "價格不可為負數"),
  sortOrder: z.coerce.number().int().min(0, "排序不可為負數"),
  isActive: z.boolean(),
});

export type CoursePlanSchemaValues = z.infer<typeof coursePlanSchema>;
