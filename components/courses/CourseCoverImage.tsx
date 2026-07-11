import Image from "next/image";
import { getCourseCoverDisplaySrc } from "@/lib/courses/cover-image";

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
  const displaySrc = getCourseCoverDisplaySrc(src);

  if (fill) {
    return (
      <Image
        src={displaySrc}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
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
    />
  );
}
