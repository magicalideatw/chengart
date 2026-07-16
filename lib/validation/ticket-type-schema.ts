import { z } from "zod";

export const ticketTypeSchema = z.object({
  id: z.string().uuid().optional(),
  courseId: z.string().min(1),
  name: z.string().min(1, "請填寫票種名稱"),
  price: z.coerce.number().int().min(0, "售價不可為負數"),
  description: z.string().trim().optional().default(""),
  isActive: z.boolean(),
});
