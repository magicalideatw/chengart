import { COURSE_PLACEHOLDER_IMAGE } from "@/lib/courses/constants";

export function resolveCourseCoverSrc(
  coverImage: string | null | undefined,
): string | null {
  const trimmed = coverImage?.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function getCourseCoverDisplaySrc(
  coverImage: string | null | undefined,
): string {
  return resolveCourseCoverSrc(coverImage) ?? COURSE_PLACEHOLDER_IMAGE;
}
