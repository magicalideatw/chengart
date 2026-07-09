import { getActiveAnnouncements } from "@/lib/announcements/queries";

export async function HomeAnnouncementBanner() {
  const announcements = await getActiveAnnouncements();

  if (announcements.length === 0) return null;

  return (
    <div className="border-b border-gold/20 bg-gold-soft">
      <div className="mx-auto max-w-6xl space-y-2 px-5 py-3 md:px-8">
        {announcements.map((item) => (
          <div key={item.id} className="text-sm text-foreground">
            <span className="mr-2 font-semibold text-gold">{item.title}</span>
            <span className="text-foreground/80">{item.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
