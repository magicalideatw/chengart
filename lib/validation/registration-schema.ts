import { z } from "zod";

export const registrationFormSchema = z.object({
  name: z.string().min(1, "請填寫姓名"),
  phone: z
    .string()
    .min(1, "請填寫電話")
    .regex(/^[\d\-+()\s]{8,20}$/, "請輸入有效的電話號碼"),
  email: z.string().min(1, "請填寫 Email").email("請輸入有效的 Email"),
  studentName: z.string().min(1, "請填寫學生姓名"),
  studentAge: z.string().min(1, "請填寫年齡"),
  isFirstTime: z.enum(["yes", "no"], { message: "請選擇是否第一次參加" }),
  note: z.string().optional(),
});

export type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

export const registrationOrderFormSchema = registrationFormSchema.extend({
  sessionIds: z.array(z.string().uuid()).optional(),
});

export type RegistrationOrderFormValues = z.infer<
  typeof registrationOrderFormSchema
>;
