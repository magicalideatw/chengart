"use client";

import { useState } from "react";
import Image from "next/image";
import {
  COURSE_PLACEHOLDER_IMAGE,
} from "@/lib/courses/constants";
import {
  getCourseCoverDisplaySrc,
  isAllowedCourseCoverDisplaySrc,
} from "@/lib/courses/cover-image";

type CourseCoverImageProps = {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function CourseCoverImage({
  src,
  alt,
  fill = true,
  width,
  height,
  className = "object-cover",
  sizes,
  priority,
}: CourseCoverImageProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = getCourseCoverDisplaySrc(src);
  const displaySrc =
    failed || !isAllowedCourseCoverDisplaySrc(resolvedSrc)
      ? COURSE_PLACEHOLDER_IMAGE
      : resolvedSrc;

  if (fill) {
    return (
      <Image
        src={displaySrc}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={displaySrc}
      alt={alt}
      width={width ?? 144}
      height={height ?? 96}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}
