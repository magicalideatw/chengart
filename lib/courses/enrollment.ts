import type { Course, CourseWithEnrollment } from "@/lib/courses/types";

export function isBeforeRegistrationDeadline(
  course: Pick<Course, "registrationDeadline">,
): boolean {
  const deadline = course.registrationDeadline?.trim();
  if (!deadline) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(`${deadline}T23:59:59`);
  if (Number.isNaN(deadlineDate.getTime())) return true;

  return today <= deadlineDate;
}

export function getEnrollmentStatusLabel(input: {
  course: CourseWithEnrollment;
  usesSessions: boolean;
  hasSelectableSessions: boolean;
}): "招生中" | "已額滿" | "已截止" | "未開放" {
  const { course, usesSessions, hasSelectableSessions } = input;

  if (!course.isOpen) return "未開放";
  if (!isBeforeRegistrationDeadline(course)) return "已截止";

  if (usesSessions) {
    return hasSelectableSessions ? "招生中" : "已額滿";
  }

  return course.isFull ? "已額滿" : "招生中";
}

export function isCourseRegistrationOpen(input: {
  course: CourseWithEnrollment;
  usesSessions: boolean;
  hasSelectableSessions: boolean;
}): boolean {
  const status = getEnrollmentStatusLabel(input);
  return status === "招生中";
}

export function getCourseTransferDeadlineDays(
  course: Pick<Course, "transferDeadlineDays">,
  systemDefault: number,
): number {
  if (
    typeof course.transferDeadlineDays === "number" &&
    course.transferDeadlineDays > 0
  ) {
    return course.transferDeadlineDays;
  }

  return systemDefault;
}
