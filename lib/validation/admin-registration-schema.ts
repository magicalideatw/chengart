import { z } from "zod";

export const adminRegistrationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  courseId: z.string().min(1, "請選擇課程"),
  name: z.string().min(1, "請填寫姓名"),
  phone: z
    .string()
    .min(1, "請填寫電話")
    .regex(/^[\d\-+()\s]{8,20}$/, "請輸入有效的電話號碼"),
  email: z.string().min(1, "請填寫 Email").email("請輸入有效的 Email"),
  studentName: z.string().min(1, "請填寫學生姓名"),
  studentAge: z.string().min(1, "請填寫年齡"),
  isFirstTime: z.boolean(),
  note: z.string(),
});

export type AdminRegistrationFormValues = z.infer<typeof adminRegistrationSchema>;
