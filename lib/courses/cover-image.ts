import {
  COURSE_COVER_PATH_PREFIX,
  COURSE_COVERS_BUCKET,
  COURSE_PLACEHOLDER_IMAGE,
  DEPRECATED_COURSE_COVERS_BUCKET,
  LEGACY_COURSE_COVERS_BUCKET,
} from "@/lib/courses/constants";

const EXTERNAL_URL_PATTERN = /^https?:\/\//i;
const SUPABASE_PUBLIC_STORAGE_PATTERN =
  /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/i;

const LEGACY_COVER_BUCKETS = new Set([
  COURSE_COVERS_BUCKET,
  DEPRECATED_COURSE_COVERS_BUCKET,
  LEGACY_COURSE_COVERS_BUCKET,
]);

function getSupabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? null;
}

export function buildCourseCoverStoragePath(filename: string): string {
  return `${COURSE_COVER_PATH_PREFIX}${filename}`;
}

export function buildSupabasePublicStorageUrl(
  bucket: string,
  objectPath: string,
): string | null {
  const baseUrl = getSupabaseUrl();
  if (!baseUrl) return null;

  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

function parseSupabasePublicStorageUrl(
  value: string,
): { bucket: string; objectPath: string } | null {
  const match = value.match(SUPABASE_PUBLIC_STORAGE_PATTERN);
  if (!match) return null;

  const bucket = match[1];
  const objectPath = decodeURIComponent(match[2]);
  if (!bucket || !objectPath) return null;

  return { bucket, objectPath };
}

function extractCourseCoverObjectPath(trimmed: string): string | null {
  if (trimmed.startsWith(COURSE_COVER_PATH_PREFIX)) {
    const objectPath = trimmed.slice(COURSE_COVER_PATH_PREFIX.length);
    return objectPath || null;
  }

  if (trimmed.startsWith(`${DEPRECATED_COURSE_COVERS_BUCKET}/`)) {
    const objectPath = trimmed.slice(`${DEPRECATED_COURSE_COVERS_BUCKET}/`.length);
    return objectPath || null;
  }

  if (trimmed.startsWith(`${LEGACY_COURSE_COVERS_BUCKET}/`)) {
    const objectPath = trimmed.slice(`${LEGACY_COURSE_COVERS_BUCKET}/`.length);
    return objectPath || null;
  }

  if (!trimmed.includes("/")) {
    return trimmed;
  }

  return null;
}

function parseStoredCourseCoverPath(
  value: string,
): { bucket: string; objectPath: string } | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === COURSE_PLACEHOLDER_IMAGE) return null;

  if (EXTERNAL_URL_PATTERN.test(trimmed)) {
    const parsed = parseSupabasePublicStorageUrl(trimmed);
    if (!parsed) return null;

    if (LEGACY_COVER_BUCKETS.has(parsed.bucket)) {
      return { bucket: COURSE_COVERS_BUCKET, objectPath: parsed.objectPath };
    }

    return null;
  }

  const objectPath = extractCourseCoverObjectPath(trimmed);
  if (!objectPath) return null;

  return { bucket: COURSE_COVERS_BUCKET, objectPath };
}

/** Normalize DB value to a storage path like `event-covers/uuid.webp`, or empty string */
export function normalizeCourseCoverStorageValue(
  coverImage: string | null | undefined,
): string {
  const trimmed = coverImage?.trim();
  if (!trimmed || trimmed === COURSE_PLACEHOLDER_IMAGE) return "";

  if (EXTERNAL_URL_PATTERN.test(trimmed)) {
    const parsed = parseSupabasePublicStorageUrl(trimmed);
    if (!parsed) return "";

    if (LEGACY_COVER_BUCKETS.has(parsed.bucket)) {
      return `${COURSE_COVER_PATH_PREFIX}${parsed.objectPath}`;
    }

    return "";
  }

  const objectPath = extractCourseCoverObjectPath(trimmed);
  if (!objectPath) return "";

  return `${COURSE_COVER_PATH_PREFIX}${objectPath}`;
}

export function sanitizeCourseCoverForStorage(
  coverImage: string | null | undefined,
): string | null {
  const normalized = normalizeCourseCoverStorageValue(coverImage);
  return normalized || null;
}

/** Resolve a safe src for next/image — never returns external URLs like Unsplash */
export function resolveCourseCoverSrc(
  coverImage: string | null | undefined,
): string | null {
  const storagePath = normalizeCourseCoverStorageValue(coverImage);
  if (!storagePath) return null;

  const parsed = parseStoredCourseCoverPath(storagePath);
  if (!parsed) return null;

  return buildSupabasePublicStorageUrl(parsed.bucket, parsed.objectPath);
}

export function getCourseCoverDisplaySrc(
  coverImage: string | null | undefined,
): string {
  return resolveCourseCoverSrc(coverImage) ?? COURSE_PLACEHOLDER_IMAGE;
}

export function getCourseCoverAbsoluteUrl(
  coverImage: string | null | undefined,
  siteUrl: string,
): string {
  const displaySrc = getCourseCoverDisplaySrc(coverImage);
  if (displaySrc.startsWith("/")) {
    return new URL(displaySrc, siteUrl).toString();
  }
  return displaySrc;
}

export function isAllowedCourseCoverDisplaySrc(src: string): boolean {
  if (src.startsWith("/")) return true;

  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) return false;

  return src.startsWith(`${supabaseUrl}/storage/v1/object/public/`);
}
