import { z } from "zod";
import { genderSchema } from "@/lib/registration/gender";

export const adminOrderStudentSchema = z.object({
  id: z.string().uuid().optional(),
  studentName: z.string().min(1, "請填寫學生姓名"),
  studentAge: z.string().min(1, "請填寫年齡"),
  gender: genderSchema,
  isFirstTime: z.boolean().optional().default(false),
  note: z.string(),
  sessionIds: z.array(z.string().uuid()),
  registrationIds: z.array(z.string().uuid()),
});

export const adminOrderUpdateSchema = z.object({
  orderId: z.string().uuid().nullable(),
  registrationIds: z.array(z.string().uuid()).min(1),
  courseId: z.string().min(1, "請選擇課程"),
  name: z.string().min(1, "請填寫姓名"),
  phone: z
    .string()
    .min(1, "請填寫電話")
    .regex(/^[\d\-+()\s]{8,20}$/, "請輸入有效的電話號碼"),
  email: z.string().min(1, "請填寫 Email").email("請輸入有效的 Email"),
  parentNote: z.string(),
  students: z.array(adminOrderStudentSchema).min(1, "請至少保留一位學生"),
});

export type AdminOrderUpdateInput = z.infer<typeof adminOrderUpdateSchema>;

/** @deprecated */
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
  isFirstTime: z.boolean().optional().default(false),
  note: z.string(),
});

export type AdminRegistrationFormValues = z.infer<typeof adminRegistrationSchema>;
