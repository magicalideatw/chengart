/** Suggested URL-safe identifier for display when copying a course (courses use UUID in URLs). */
export function suggestCourseCopySlug(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/[^\x00-\x7F]+/g, "")
    .slice(0, 60);

  return slug || `copy-${Date.now()}`;
}

export function suggestCopySlugFromTitle(title: string, sourceSlugHint?: string): string {
  const base = suggestCourseCopySlug(title);
  if (sourceSlugHint) {
    const fromSource = `${sourceSlugHint}-copy`.slice(0, 80);
    return fromSource || base;
  }
  return `${base}-copy`.slice(0, 80);
}
