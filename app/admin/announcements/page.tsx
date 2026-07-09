import type { Metadata } from "next";
import { AnnouncementManagement } from "@/components/admin/AnnouncementManagement";
import { getAllAnnouncements } from "@/lib/announcements/queries";

export const metadata: Metadata = {
  title: "首頁公告",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const announcements = await getAllAnnouncements();

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementManagement announcements={announcements} />
    </div>
  );
}
