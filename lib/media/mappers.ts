import type { Database } from "@/lib/supabase/database.types";
import type { CourseMediaRecord, MediaType } from "@/lib/media/types";

type CourseMediaRow = Database["public"]["Tables"]["course_media"]["Row"];

function parseMediaType(value: unknown): MediaType {
  return value === "youtube" || value === "vimeo" || value === "mp4"
    ? value
    : "youtube";
}

export function mapCourseMediaRow(row: Record<string, unknown>): CourseMediaRecord {
  const media = row as CourseMediaRow;

  return {
    id: media.id ?? "",
    courseId: media.course_id ?? "",
    mediaType: parseMediaType(media.media_type),
    title: media.title ?? "",
    sourceUrl: media.source_url ?? "",
    sortOrder: media.sort_order ?? 0,
    isVisible: media.is_visible ?? true,
    createdAt: media.created_at ?? new Date().toISOString(),
    updatedAt: media.updated_at ?? new Date().toISOString(),
  };
}

export function mapCourseMediaToDb(
  input: import("@/lib/media/types").CourseMediaFormInput,
): Database["public"]["Tables"]["course_media"]["Insert"] {
  return {
    course_id: input.courseId,
    media_type: input.mediaType,
    title: input.title.trim(),
    source_url: input.sourceUrl.trim(),
    sort_order: input.sortOrder,
    is_visible: input.isVisible,
    updated_at: new Date().toISOString(),
  };
}
