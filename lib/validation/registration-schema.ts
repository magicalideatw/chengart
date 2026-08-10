import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/payment/types";
import type { ActiveRegistrationType } from "@/lib/courses/registration-mode";
import { genderSchema } from "@/lib/registration/gender";

export const registrationStudentSchema = z.object({
  clientId: z.string().optional(),
  studentName: z.string().min(1, "請填寫學生姓名"),
  studentAge: z.string().min(1, "請填寫年齡"),
  gender: genderSchema,
  isFirstTime: z.enum(["yes", "no"]).optional(),
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

export const adultFormSchema = z.object({
  name: z.string().min(1, "請填寫姓名"),
  phone: z
    .string()
    .min(1, "請填寫電話")
    .regex(/^[\d\-+()\s]{8,20}$/, "請輸入有效的電話號碼"),
  email: z.string().min(1, "請填寫 Email").email("請輸入有效的 Email"),
  age: z.string().min(1, "請填寫年齡"),
  gender: genderSchema,
  isFirstTime: z.enum(["yes", "no"]).optional(),
  note: z.string().optional(),
  sessionIds: z.array(z.string().uuid()).optional(),
});

export type AdultFormValues = z.infer<typeof adultFormSchema>;

/** @deprecated use ParentFormValues */
export const registrationFormSchema = parentFormSchema.extend({
  studentName: z.string().optional(),
  studentAge: z.string().optional(),
  isFirstTime: z.enum(["yes", "no"]).optional(),
  note: z.string().optional(),
});

export type RegistrationFormValues = ParentFormValues;

export const registrationOrderFormSchema = parentFormSchema.extend({
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  registrationType: z.enum(["adult", "parent"]).optional(),
  sessionIds: z.array(z.string().uuid()).optional(),
  promoCode: z.string().trim().optional(),
  pricingSnapshot: z.custom<import("@/lib/pricing/types").PricingSnapshot>().optional(),
  coursePlanId: z.string().uuid().optional(),
  coursePlanName: z.string().trim().optional(),
  coursePlanSessionCount: z.coerce.number().int().min(1).optional(),
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
    note: "",
    sessionIds: [],
  } as unknown as RegistrationStudentInput;
}

export const defaultParentFormValues = {
  name: "",
  phone: "",
  email: "",
  parentNote: "",
  students: [createDefaultStudent(0)],
} as ParentFormValues;

export const defaultAdultFormValues = {
  name: "",
  phone: "",
  email: "",
  age: "",
  note: "",
  sessionIds: [] as string[],
} as AdultFormValues;

export function adultFormToOrderData(
  values: AdultFormValues,
  registrationType: ActiveRegistrationType = "adult",
): RegistrationOrderFormValues {
  return {
    name: values.name,
    phone: values.phone,
    email: values.email,
    parentNote: values.note,
    registrationType,
    students: [
      {
        clientId: "adult-self",
        studentName: values.name,
        studentAge: values.age,
        gender: values.gender,
        note: values.note,
        sessionIds: values.sessionIds ?? [],
      },
    ],
  };
}

export function parentFormToOrderData(
  values: ParentFormValues,
): RegistrationOrderFormValues {
  return {
    ...values,
    registrationType: "parent",
  };
}
