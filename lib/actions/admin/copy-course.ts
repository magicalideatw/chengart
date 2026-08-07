"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getClassesByCourseId } from "@/lib/classes/queries";
import { mapClassToDb } from "@/lib/classes/mappers";
import { classRecordToFormInput } from "@/lib/classes/mappers";
import { mapCourseRow, mapCourseToDb } from "@/lib/courses/mappers";
import { getCourseById } from "@/lib/courses/queries";
import type { Course, CourseFormInput } from "@/lib/courses/types";
import { getDefaultActionButtonText } from "@/lib/courses/participation-method";
import { mapSessionToDb } from "@/lib/sessions/mappers";
import { sessionToFormInput } from "@/lib/sessions/mappers";
import { getSessionsByClassId } from "@/lib/sessions/queries";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { copyCourseMedia } from "@/lib/media/queries";
import { adminCourseSchema } from "@/lib/validation/admin-course-schema";
import { copyCourseSchema } from "@/lib/validation/copy-course-schema";

export type CopyCourseResult =
  | { success: true; course: Course }
  | { success: false; error: string };

function courseToFormInput(course: Course): CourseFormInput {
  return {
    title: course.title,
    category: course.category,
    description: course.description,
    courseDetails: course.courseDetails,
    activityType: course.activityType,
    activityRules: course.activityRules,
    participationMethod: course.participationMethod,
    externalUrl: course.externalUrl ?? "",
    actionButtonText: course.actionButtonText,
    sessionDate: course.sessionDate,
    sessionTime: course.sessionTime,
    capacity: course.capacity,
    coverImage: course.coverImage,
    isOpen: course.isOpen,
    allowedPaymentMethods: course.allowedPaymentMethods.filter(
      (method): method is "ecpay" | "bank_transfer" =>
        method === "ecpay" || method === "bank_transfer",
    ),
    registrationMode: course.registrationMode,
    pricePerStudent: course.pricePerStudent,
    registrationDeadline: course.registrationDeadline ?? "",
    showRemainingCapacity: course.showRemainingCapacity,
    transferDeadlineDays: course.transferDeadlineDays,
    earlyBirdEnabled: course.earlyBirdEnabled,
    earlyBirdDeadline: course.earlyBirdDeadline ?? "",
    earlyBirdDiscountType: course.earlyBirdDiscountType ?? "percent",
    earlyBirdDiscountValue: course.earlyBirdDiscountValue,
    groupDiscountEnabled: course.groupDiscountEnabled,
    groupDiscountMinStudents: course.groupDiscountMinStudents ?? 2,
    groupDiscountType: course.groupDiscountType ?? "percent",
    groupDiscountValue: course.groupDiscountValue,
  };
}

function buildCopyFormInput(
  source: Course,
  title: string,
  options: {
    copyIntro: boolean;
    copyCoverImage: boolean;
    copySessions: boolean;
    copyPricing: boolean;
    copyRegistrationSettings: boolean;
    copyPaymentMethods: boolean;
  },
): CourseFormInput {
  const base = courseToFormInput(source);
  const today = new Date().toISOString().slice(0, 10);

  return {
    ...base,
    title,
    description: options.copyIntro ? base.description : "待補充活動介紹",
    courseDetails: options.copyIntro ? base.courseDetails : "",
    activityType: options.copyIntro ? base.activityType : "course",
    activityRules: options.copyIntro ? base.activityRules : "",
    participationMethod: options.copyRegistrationSettings
      ? base.participationMethod
      : "internal",
    externalUrl: options.copyRegistrationSettings ? base.externalUrl : "",
    actionButtonText: options.copyRegistrationSettings
      ? base.actionButtonText
      : getDefaultActionButtonText(options.copyIntro ? base.activityType : "course"),
    coverImage: options.copyCoverImage ? base.coverImage : "",
    sessionDate: options.copySessions ? base.sessionDate : today,
    sessionTime: options.copySessions ? base.sessionTime : "09:00",
    pricePerStudent: options.copyPricing ? base.pricePerStudent : 0,
    earlyBirdEnabled: options.copyPricing ? base.earlyBirdEnabled : false,
    earlyBirdDeadline: options.copyPricing ? base.earlyBirdDeadline : "",
    earlyBirdDiscountType: options.copyPricing
      ? base.earlyBirdDiscountType
      : "percent",
    earlyBirdDiscountValue: options.copyPricing
      ? base.earlyBirdDiscountValue
      : 0,
    groupDiscountEnabled: options.copyPricing ? base.groupDiscountEnabled : false,
    groupDiscountMinStudents: options.copyPricing
      ? base.groupDiscountMinStudents
      : 2,
    groupDiscountType: options.copyPricing ? base.groupDiscountType : "percent",
    groupDiscountValue: options.copyPricing ? base.groupDiscountValue : 0,
    registrationMode: options.copyRegistrationSettings
      ? base.registrationMode
      : "adult",
    registrationDeadline: options.copyRegistrationSettings
      ? base.registrationDeadline
      : "",
    showRemainingCapacity: options.copyRegistrationSettings
      ? base.showRemainingCapacity
      : true,
    transferDeadlineDays: options.copyRegistrationSettings
      ? base.transferDeadlineDays
      : 7,
    allowedPaymentMethods: options.copyPaymentMethods
      ? base.allowedPaymentMethods
      : options.copyPricing && base.pricePerStudent > 0
        ? ["ecpay"]
        : [],
    isOpen: false,
  };
}

function revalidateCoursePaths(courseId: string) {
  revalidatePath("/");
  revalidatePath("/admin/courses");
  revalidatePath(`/courses/${courseId}`);
}

export async function copyCourse(input: unknown): Promise<CopyCourseResult> {
  await requireAuthenticatedUser();

  const parsed = copyCourseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定，無法複製活動" };
  }

  const {
    sourceCourseId,
    title,
    copyIntro,
    copyCoverImage,
    copySessions,
    copyPricing,
    copyRegistrationSettings,
    copyPaymentMethods,
  } = parsed.data;

  const source = await getCourseById(sourceCourseId);
  if (!source) {
    return { success: false, error: "找不到來源活動" };
  }

  const formInput = buildCopyFormInput(source, title, {
    copyIntro,
    copyCoverImage,
    copySessions,
    copyPricing,
    copyRegistrationSettings,
    copyPaymentMethods,
  });

  const validated = adminCourseSchema.safeParse(formInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message ?? "複製資料有誤",
    };
  }

  const supabase = await createServerClient();

  const { data: inserted, error: insertError } = await supabase
    .from("courses")
    .insert(mapCourseToDb(validated.data))
    .select("*")
    .single();

  if (insertError || !inserted) {
    console.error("Copy course insert failed:", insertError?.message);
    return {
      success: false,
      error:
        insertError?.code === "42501"
          ? "無寫入權限。請確認已登入，並在 Supabase 執行 004_admin_auth_policies.sql"
          : "建立副本失敗，請稍後再試",
    };
  }

  const newCourseId = String(inserted.id);

  if (copyIntro) {
    const mediaResult = await copyCourseMedia(sourceCourseId, newCourseId);
    if (!mediaResult.success) {
      console.error("Copy course media failed:", mediaResult.error);
    }
  }

  if (copySessions) {
    const classes = await getClassesByCourseId(sourceCourseId);

    for (const courseClass of classes) {
      const classInput = classRecordToFormInput(courseClass);
      const { data: newClass, error: classError } = await supabase
        .from("classes")
        .insert(mapClassToDb(newCourseId, classInput))
        .select("id")
        .single();

      if (classError || !newClass) {
        console.error("Copy class failed:", classError?.message);
        continue;
      }

      const sessions = await getSessionsByClassId(courseClass.id);
      for (const session of sessions) {
        const sessionInput = {
          ...sessionToFormInput(session),
          status: "open" as const,
          remainingCapacity: session.capacity,
        };

        const { error: sessionError } = await supabase
          .from("sessions")
          .insert(
            mapSessionToDb(newCourseId, sessionInput, 0, String(newClass.id)),
          );

        if (sessionError) {
          console.error("Copy session failed:", sessionError.message);
        }
      }
    }
  }

  revalidateCoursePaths(newCourseId);

  const course = mapCourseRow(inserted);
  return { success: true, course };
}
