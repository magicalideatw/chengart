export const COURSE_COVERS_BUCKET = "course-covers";

/** Legacy bucket from migration 019 — still readable for old uploads */
export const LEGACY_COURSE_COVERS_BUCKET = "courses";

export const COURSE_COVER_MAX_FILE_SIZE = 30 * 1024 * 1024;

export const COURSE_COVER_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const COURSE_COVER_ACCEPT = "image/jpeg,image/png,image/webp";

export const COURSE_PLACEHOLDER_IMAGE = "/images/course-placeholder.svg";

export const COURSE_COVER_PATH_PREFIX = `${COURSE_COVERS_BUCKET}/`;
