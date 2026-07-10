import type { Metadata } from "next";
import { EventManagement } from "@/components/admin/EventManagement";
import { getAllEvents, usesEventsCms } from "@/lib/events/queries";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "活動管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const [events, cmsReady] = await Promise.all([getAllEvents(), usesEventsCms()]);

  return (
    <div className="min-h-screen bg-background">
      <EventManagement
        events={events}
        canMutate={isSupabaseConfigured() && cmsReady}
      />
    </div>
  );
}
