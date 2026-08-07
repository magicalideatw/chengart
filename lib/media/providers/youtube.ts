export function parseYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery) return fromQuery;

      const embedMatch = url.pathname.match(/^\/embed\/([^/?]+)/);
      if (embedMatch?.[1]) return embedMatch[1];
    }
  } catch {
    return null;
  }

  return null;
}

export function getYoutubeEmbedUrl(sourceUrl: string): string | null {
  const videoId = parseYoutubeVideoId(sourceUrl);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

export function isValidYoutubeUrl(sourceUrl: string): boolean {
  return parseYoutubeVideoId(sourceUrl) !== null;
}
