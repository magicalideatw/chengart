/**
 * Diagnostic script for updateCourse failures.
 * Does NOT modify application code — only probes Supabase + validation shape.
 */
import { createClient } from "@supabase/supabase-js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const key = (serviceKey && serviceKey.length > 0 ? serviceKey : anonKey) ?? "";
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or Supabase API key");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  console.log(title);
  console.log("=".repeat(60));
}

function buildUpdatePayloadFromRow(row) {
  return {
    title: row.title,
    category: row.category,
    description: row.description,
    course_details: (row.course_details ?? "").trim(),
    youtube_url: null,
    activity_type: row.activity_type ?? "course",
    activity_rules: (row.activity_rules ?? "").trim(),
    participation_method: row.participation_method ?? "internal",
    external_url:
      row.participation_method === "external" ? row.external_url : null,
    action_button_text: row.action_button_text ?? "立即報名",
    session_date: row.session_date,
    session_time: row.session_time,
    capacity: row.capacity ?? 5,
    fee: row.price_per_student ?? row.fee ?? 0,
    cover_image: row.cover_image,
    is_open: row.is_open ?? true,
    allowed_payment_methods: row.allowed_payment_methods ?? [],
    registration_mode: row.registration_mode ?? "adult",
    price_per_student: row.price_per_student ?? row.fee ?? 0,
    registration_deadline: row.registration_deadline,
    show_remaining_capacity: row.show_remaining_capacity ?? true,
    transfer_deadline_days: row.transfer_deadline_days,
    early_bird_enabled: row.early_bird_enabled ?? false,
    early_bird_deadline: row.early_bird_deadline,
    early_bird_discount_type: row.early_bird_enabled
      ? row.early_bird_discount_type
      : null,
    early_bird_discount_value: row.early_bird_discount_value ?? 0,
    group_discount_enabled: row.group_discount_enabled ?? false,
    group_discount_min_students: row.group_discount_enabled
      ? row.group_discount_min_students
      : null,
    group_discount_type: row.group_discount_enabled
      ? row.group_discount_type
      : null,
    group_discount_value: row.group_discount_value ?? 0,
  };
}

async function probeColumn(name) {
  const { error } = await admin.from("courses").select(name).limit(1);
  console.log(
    `${name}:`,
    error ? `ERROR → ${error.code} ${error.message}` : "OK",
  );
  return !error;
}

async function main() {
  logSection("Environment");
  console.log("URL:", url);
  console.log("Using service role:", Boolean(serviceKey));

  logSection("1. courses column probes");
  const columns = [
    "id",
    "title",
    "course_details",
    "youtube_url",
    "activity_type",
    "activity_rules",
    "participation_method",
    "external_url",
    "action_button_text",
    "activity_status",
  ];
  for (const col of columns) {
    await probeColumn(col);
  }

  logSection("2. Fetch sample course");
  const { data: course, error: fetchError } = await admin
    .from("courses")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error("Fetch failed:", JSON.stringify(fetchError, null, 2));
    process.exit(1);
  }
  if (!course) {
    console.error("No courses found");
    process.exit(1);
  }

  console.log("Course id:", course.id);
  console.log("Course title:", course.title);
  console.log("Row keys:", Object.keys(course).sort().join(", "));

  logSection("3. UPDATE without youtube_url (legacy payload)");
  const legacyPayload = buildUpdatePayloadFromRow(course);
  delete legacyPayload.youtube_url;
  console.log("Update payload:", JSON.stringify(legacyPayload, null, 2));

  const legacyResult = await admin
    .from("courses")
    .update(legacyPayload)
    .eq("id", course.id)
    .select("id, title, updated_at");

  if (legacyResult.error) {
    console.error("Legacy UPDATE error:");
    console.error(JSON.stringify(legacyResult.error, null, 2));
  } else {
    console.log("Legacy UPDATE OK:", legacyResult.data);
  }

  logSection("4. UPDATE with youtube_url (current mapCourseToDb shape)");
  const fullPayload = buildUpdatePayloadFromRow(course);
  fullPayload.youtube_url = null;
  console.log("Update payload:", JSON.stringify(fullPayload, null, 2));

  const fullResult = await admin
    .from("courses")
    .update(fullPayload)
    .eq("id", course.id)
    .select("id, title, youtube_url, updated_at");

  if (fullResult.error) {
    console.error("Full payload UPDATE error:");
    console.error(JSON.stringify(fullResult.error, null, 2));
  } else {
    console.log("Full payload UPDATE OK:", fullResult.data);
  }

  logSection("5. UPDATE youtube_url only");
  const youtubeOnly = { youtube_url: "https://youtu.be/dQw4w9WgXcQ" };
  console.log("Update payload:", JSON.stringify(youtubeOnly, null, 2));
  const ytResult = await admin
    .from("courses")
    .update(youtubeOnly)
    .eq("id", course.id)
    .select("id, youtube_url");

  if (ytResult.error) {
    console.error("youtube_url UPDATE error:");
    console.error(JSON.stringify(ytResult.error, null, 2));
  } else {
    console.log("youtube_url UPDATE OK:", ytResult.data);
    await admin
      .from("courses")
      .update({ youtube_url: course.youtube_url ?? null })
      .eq("id", course.id);
    console.log("Restored original youtube_url");
  }

  logSection("6. cover_image constraint probe (https external URL)");
  const coverProbe = {
    cover_image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80",
  };
  console.log("Update payload:", JSON.stringify(coverProbe, null, 2));
  const coverResult = await admin
    .from("courses")
    .update(coverProbe)
    .eq("id", course.id)
    .select("id, cover_image");

  if (coverResult.error) {
    console.error("cover_image UPDATE error:");
    console.error(JSON.stringify(coverResult.error, null, 2));
  } else {
    console.log("cover_image UPDATE OK (DB accepts https URLs)");
    await admin
      .from("courses")
      .update({ cover_image: course.cover_image })
      .eq("id", course.id);
  }

  logSection("Done");
}

main().catch((err) => {
  console.error("Script crashed:", err);
  process.exit(1);
});
