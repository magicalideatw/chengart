import { EVENT_COVERS_BUCKET } from "@/lib/events/constants";

/** Shared with events — see 010_event_covers_storage.sql */
export const COURSE_COVERS_BUCKET = EVENT_COVERS_BUCKET;

/** Legacy bucket/prefix from migration 019 — files resolve via event-covers */
export const LEGACY_COURSE_COVERS_BUCKET = "courses";

/** Deprecated prefix from migration 020 — files resolve via event-covers */
export const DEPRECATED_COURSE_COVERS_BUCKET = "course-covers";

export const COURSE_COVER_MAX_FILE_SIZE = 30 * 1024 * 1024;

export const COURSE_COVER_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const COURSE_COVER_ACCEPT = "image/jpeg,image/png,image/webp";

export const COURSE_PLACEHOLDER_IMAGE = "/images/course-placeholder.svg";

export const COURSE_COVER_PATH_PREFIX = `${COURSE_COVERS_BUCKET}/`;
