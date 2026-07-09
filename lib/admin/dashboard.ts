import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { countActiveAnnouncements } from "@/lib/announcements/queries";

export type AdminDashboardStats = {
  courses: number;
  registrations: number;
  orders: number;
  pendingOrders: number;
  paidOrders: number;
  paidRegistrations: number;
  announcements: number;
  activeAnnouncements: number;
};

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const empty: AdminDashboardStats = {
    courses: 0,
    registrations: 0,
    orders: 0,
    pendingOrders: 0,
    paidOrders: 0,
    paidRegistrations: 0,
    announcements: 0,
    activeAnnouncements: 0,
  };

  if (!isSupabaseConfigured()) return empty;

  const supabase = await createServerClient();

  const [courses, registrations, orders, announcements, activeAnnouncements] =
    await Promise.all([
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("registrations").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("status"),
      supabase
        .from("homepage_announcements")
        .select("*", { count: "exact", head: true }),
      countActiveAnnouncements(),
    ]);

  const orderRows = orders.data ?? [];
  const pendingOrders = orderRows.filter((row) => row.status === "pending").length;
  const paidOrders = orderRows.filter((row) => row.status === "paid").length;

  let paidRegistrations = registrations.count ?? 0;
  const paidRegs = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("status", "paid");

  if (!paidRegs.error) {
    paidRegistrations = paidRegs.count ?? 0;
  }

  return {
    courses: courses.count ?? 0,
    registrations: registrations.count ?? 0,
    orders: orderRows.length,
    pendingOrders: orders.error?.code === "PGRST205" ? 0 : pendingOrders,
    paidOrders: orders.error?.code === "PGRST205" ? 0 : paidOrders,
    paidRegistrations,
    announcements: announcements.error?.code === "PGRST205" ? 0 : (announcements.count ?? 0),
    activeAnnouncements,
  };
}
