/** URL slug helpers for events CMS. */

export function slugifyEventTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/[^\x00-\x7F]+/g, "")
    .slice(0, 80);

  return slug || `event-${Date.now()}`;
}

export function suggestEventCopySlug(title: string, sourceSlug?: string): string {
  const fromTitle = slugifyEventTitle(title);
  if (sourceSlug) {
    return `${sourceSlug}-copy`.slice(0, 80) || fromTitle;
  }
  return fromTitle;
}

export async function ensureUniqueEventSlug(
  baseSlug: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const normalized = baseSlug.trim().toLowerCase();
  if (!(await isTaken(normalized))) {
    return normalized;
  }

  for (let index = 2; index < 100; index += 1) {
    const candidate = `${normalized}-${index}`.slice(0, 80);
    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }

  return `${normalized}-${Date.now()}`.slice(0, 80);
}
