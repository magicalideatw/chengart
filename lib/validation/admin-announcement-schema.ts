import { z } from "zod";

export const adminAnnouncementSchema = z.object({
  title: z.string().min(1, "請輸入公告標題").max(100, "標題最多 100 字"),
  content: z.string().min(1, "請輸入公告內容").max(500, "內容最多 500 字"),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  startsAt: z.string(),
  endsAt: z.string(),
});

export type AdminAnnouncementInput = z.infer<typeof adminAnnouncementSchema>;
