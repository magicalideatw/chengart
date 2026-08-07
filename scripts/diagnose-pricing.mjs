/**
 * Diagnose paid/free activity pricing — read-only Supabase probe.
 */
import { createClient } from "@supabase/supabase-js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require("@next/env").loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const supabase = createClient(url, key);

function logSection(t) {
  console.log("\n" + "=".repeat(60));
  console.log(t);
  console.log("=".repeat(60));
}

async function main() {
  logSection("Performance activities: course + ticket_types + sessions");

  const { data: performances, error: perfErr } = await supabase
    .from("courses")
    .select("id, title, fee, price_per_student, activity_type")
    .eq("activity_type", "performance")
    .order("created_at", { ascending: false });

  if (perfErr) {
    console.error(JSON.stringify(perfErr, null, 2));
    return;
  }

  for (const course of performances ?? []) {
    const coursePrice = course.fee ?? 0;
    const pricePerStudent = course.price_per_student ?? course.fee ?? 0;

    const { data: ticketTypes } = await supabase
      .from("ticket_types")
      .select("id, name, price, is_active")
      .eq("course_id", course.id)
      .order("sort_order", { ascending: true });

    const activeTickets = (ticketTypes ?? []).filter((t) => t.is_active !== false);
    const isPaidByTickets = activeTickets.some((t) => Number(t.price) > 0);

    const { data: sessions, error: sessErr } = await supabase
      .from("sessions")
      .select("id, name, date, price, is_open, course_id")
      .eq("course_id", course.id);

    if (sessErr?.code === "42703") {
      console.log(`\n[${course.title}] sessions.price column missing (migration?)`);
      continue;
    }

    const sessionPrices = (sessions ?? []).map((s) => Number(s.price ?? 0));
    const maxSessionPrice = sessionPrices.length ? Math.max(...sessionPrices) : 0;
    const isPaidBySession = maxSessionPrice > 0;

    const frontendWouldShowFree = !isPaidByTickets;

    console.log("\n---", course.title, "---");
    console.log(
      JSON.stringify(
        {
          courseId: course.id,
          coursePrice,
          pricePerStudent,
          activeTicketCount: activeTickets.length,
          ticketPrices: activeTickets.map((t) => ({ name: t.name, price: t.price })),
          isPaidByTickets,
          sessionCount: sessions?.length ?? 0,
          sessionPrices: sessions?.map((s) => ({
            name: s.name,
            date: s.date,
            price: s.price,
          })),
          maxSessionPrice,
          isPaidBySession,
          frontendWouldShowFree,
          uiReason: frontendWouldShowFree
            ? "isPaidPerformance(ticketTypes) === false"
            : "would show payment selector when tickets selected",
        },
        null,
        2,
      ),
    );
  }

  logSection("Course activities (registration flow uses price_per_student / fee)");

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, fee, price_per_student, activity_type")
    .eq("activity_type", "course")
    .order("created_at", { ascending: false })
    .limit(5);

  for (const course of courses ?? []) {
    const coursePrice = course.fee ?? 0;
    const pricePerStudent = course.price_per_student ?? course.fee ?? 0;
    const isFreeCourse = pricePerStudent <= 0;

    const { data: sessions, error: sessErr } = await supabase
      .from("sessions")
      .select("id, name, price, course_id")
      .eq("course_id", course.id);

    if (sessErr?.code === "42703") continue;

    const maxSessionPrice = Math.max(0, ...(sessions ?? []).map((s) => Number(s.price ?? 0)));

    console.log("\n---", course.title, "---");
    console.log(
      JSON.stringify(
        {
          courseId: course.id,
          coursePrice,
          pricePerStudent,
          isFreeCourse,
          maxSessionPrice,
          registrationUsesSessionPrice: "only via getSessionUnitPrice at order time, NOT for isFreeCourse UI",
        },
        null,
        2,
      ),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
