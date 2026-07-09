"use server";

import { revalidatePath } from "next/cache";
import {
  getCourseWithEnrollment,
  getEnrollmentCount,
} from "@/lib/courses/queries";
import type { CourseWithEnrollment } from "@/lib/courses/types";
import { sendRegistrationNotifications } from "@/lib/email/send-registration-notifications";
import { createServerClient } from "@/lib/supabase";
import {
  registrationFormSchema,
  type RegistrationFormValues,
} from "@/lib/validation/registration-schema";

export type SubmitRegistrationInput = {
  courseId: string;
  formData: RegistrationFormValues;
};

export type SubmitRegistrationResult =
  | { success: true }
  | { success: false; error: string };

async function finalizeRegistration(
  courseId: string,
  course: CourseWithEnrollment,
  formData: RegistrationFormValues,
): Promise<SubmitRegistrationResult> {
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/");
  revalidatePath("/admin");

  try {
    const enrollmentCount = await getEnrollmentCount(course.id);
    await sendRegistrationNotifications({
      course,
      formData,
      enrollmentCount,
    });
  } catch (error) {
    console.error("Registration email notification failed:", error);
  }

  return { success: true };
}

export async function submitRegistration(
  input: SubmitRegistrationInput,
): Promise<SubmitRegistrationResult> {
  const parsed = registrationFormSchema.safeParse(input.formData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "表單資料有誤";
    return { success: false, error: firstError };
  }

  const course = await getCourseWithEnrollment(input.courseId);

  if (!course) {
    return { success: false, error: "找不到此課程" };
  }

  if (!course.isOpen) {
    return { success: false, error: "此課程目前未開放報名" };
  }

  if (course.isFull) {
    return { success: false, error: "此課程已額滿" };
  }

  const formData = parsed.data;
  const supabase = await createServerClient();

  const newPayload = {
    course_id: input.courseId,
    name: formData.name,
    phone: formData.phone,
    email: formData.email,
    student_name: formData.studentName,
    student_age: formData.studentAge,
    is_first_time: formData.isFirstTime === "yes",
    note: formData.note || null,
  };

  const { error: newSchemaError } = await supabase
    .from("registrations")
    .insert(newPayload);

  if (!newSchemaError) {
    return finalizeRegistration(input.courseId, course, formData);
  }

  if (newSchemaError.code !== "42703" && !newSchemaError.message.includes("course_id")) {
    if (newSchemaError.message.includes("CLASS_FULL")) {
      return { success: false, error: "此課程已額滿" };
    }

    console.error("Registration insert failed:", newSchemaError.message);
    return { success: false, error: "報名失敗，請稍後再試" };
  }

  const legacyPayload = {
    course_slug: input.courseId,
    session_date: course.sessionDate || "2099-01-01",
    class_id: "A",
    class_name: course.title,
    class_time: course.sessionTime || "—",
    name: formData.name,
    phone: formData.phone,
    email: formData.email,
    student_name: formData.studentName,
    student_age: formData.studentAge,
    is_first_time: formData.isFirstTime === "yes",
    note: formData.note || null,
  };

  const { error: legacyError } = await supabase
    .from("registrations")
    .insert(legacyPayload);

  if (legacyError) {
    if (legacyError.message.includes("CLASS_FULL")) {
      return { success: false, error: "此課程已額滿" };
    }

    console.error("Legacy registration insert failed:", legacyError.message);
    return { success: false, error: "報名失敗，請稍後再試" };
  }

  return finalizeRegistration(input.courseId, course, formData);
}
