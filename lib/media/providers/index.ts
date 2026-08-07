import type { MediaType } from "@/lib/media/types";
import { getYoutubeEmbedUrl, isValidYoutubeUrl } from "@/lib/media/providers/youtube";

export function resolveMediaEmbedUrl(
  mediaType: MediaType,
  sourceUrl: string,
): string | null {
  switch (mediaType) {
    case "youtube":
      return getYoutubeEmbedUrl(sourceUrl);
    case "vimeo":
    case "mp4":
      return null;
    default:
      return null;
  }
}

export function isSupportedMediaSource(
  mediaType: MediaType,
  sourceUrl: string,
): boolean {
  switch (mediaType) {
    case "youtube":
      return isValidYoutubeUrl(sourceUrl);
    case "vimeo":
    case "mp4":
      return false;
    default:
      return false;
  }
}

export { parseYoutubeVideoId } from "@/lib/media/providers/youtube";
