export const MEDIA_TYPES = ["youtube", "vimeo", "mp4"] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

export const SUPPORTED_MEDIA_TYPES = ["youtube"] as const;

export type SupportedMediaType = (typeof SUPPORTED_MEDIA_TYPES)[number];

export type CourseMediaRecord = {
  id: string;
  courseId: string;
  mediaType: MediaType;
  title: string;
  description?: string;
  sourceUrl: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CourseMediaFormInput = {
  id?: string;
  courseId: string;
  mediaType: SupportedMediaType;
  title: string;
  sourceUrl: string;
  sortOrder: number;
  isVisible: boolean;
};
