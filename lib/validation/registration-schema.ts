import { z } from "zod";

export const registrationStudentSchema = z.object({
  clientId: z.string().optional(),
  studentName: z.string().min(1, "請填寫學生姓名"),
  studentAge: z.string().min(1, "請填寫年齡"),
  gender: z.enum(["", "male", "female", "other"]).optional(),
  isFirstTime: z.enum(["yes", "no"], { message: "請選擇是否第一次參加" }),
  note: z.string().optional(),
  sessionIds: z.array(z.string().uuid()).optional(),
});

export type RegistrationStudentInput = z.infer<typeof registrationStudentSchema>;

export const parentFormSchema = z.object({
  name: z.string().min(1, "請填寫姓名"),
  phone: z
    .string()
    .min(1, "請填寫電話")
    .regex(/^[\d\-+()\s]{8,20}$/, "請輸入有效的電話號碼"),
  email: z.string().min(1, "請填寫 Email").email("請輸入有效的 Email"),
  parentNote: z.string().optional(),
  students: z.array(registrationStudentSchema).min(1, "請至少新增一位學生"),
});

export type ParentFormValues = z.infer<typeof parentFormSchema>;

/** @deprecated use ParentFormValues */
export const registrationFormSchema = parentFormSchema.extend({
  studentName: z.string().optional(),
  studentAge: z.string().optional(),
  isFirstTime: z.enum(["yes", "no"]).optional(),
  note: z.string().optional(),
});

export type RegistrationFormValues = ParentFormValues;

export const registrationOrderFormSchema = parentFormSchema.extend({
  sessionIds: z.array(z.string().uuid()).optional(),
  studentName: z.string().optional(),
  studentAge: z.string().optional(),
  isFirstTime: z.enum(["yes", "no"]).optional(),
  note: z.string().optional(),
});

export type RegistrationOrderFormValues = z.infer<
  typeof registrationOrderFormSchema
>;

export function createDefaultStudent(
  index = 0,
): RegistrationStudentInput {
  return {
    clientId: `student-${index + 1}`,
    studentName: "",
    studentAge: "",
    gender: "",
    isFirstTime: "yes",
    note: "",
    sessionIds: [],
  };
}

export const defaultParentFormValues: ParentFormValues = {
  name: "",
  phone: "",
  email: "",
  parentNote: "",
  students: [createDefaultStudent(0)],
};
