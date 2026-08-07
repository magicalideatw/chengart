/**
 * Diagnostic script for createCourseSession failures.
 * Does NOT modify application code — only probes Supabase.
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

async function inspectSessionsSchema() {
  logSection("1. sessions table columns (via select *)");
  const { data, error } = await admin.from("sessions").select("*").limit(1);
  if (error) {
    console.error("Select failed:", JSON.stringify(error, null, 2));
    return null;
  }
  if (!data?.length) {
    console.log("No rows in sessions; probing insert payload against schema via error messages.");
    return {};
  }
  console.log("Sample row keys:", Object.keys(data[0]));
  console.log("Sample row:", JSON.stringify(data[0], null, 2));
  return data[0];
}

async function getSampleCourseId() {
  const { data, error } = await admin
    .from("courses")
    .select("id, title, activity_type")
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("courses select failed:", JSON.stringify(error, null, 2));
    return null;
  }
  console.log("Sample course:", data);
  return data?.id ?? null;
}

function buildInsertPayload(courseId) {
  return {
    course_id: courseId,
    class_id: null,
    name: "__diagnostic_test__",
    date: "2099-01-01",
    start_time: "09:00",
    end_time: "10:00",
    capacity: 5,
    remaining_capacity: 5,
    price: 0,
    location: "",
    is_open: true,
    sort_order: 0,
    status: "open",
    notes: "diagnostic — safe to delete",
    updated_at: new Date().toISOString(),
  };
}

async function probeInsert(label, client, payload) {
  console.log(`\n--- Probe: ${label} ---`);
  console.log("Payload:", JSON.stringify(payload, null, 2));
  const { data, error } = await client.from("sessions").insert(payload).select("id");
  if (error) {
    console.error("INSERT ERROR:", JSON.stringify(error, null, 2));
    return { ok: false, error };
  }
  console.log("INSERT OK:", data);
  if (data?.[0]?.id) {
    const { error: delErr } = await client.from("sessions").delete().eq("id", data[0].id);
    if (delErr) console.error("Cleanup delete failed:", JSON.stringify(delErr, null, 2));
    else console.log("Cleaned up diagnostic row:", data[0].id);
  }
  return { ok: true };
}

async function probeMissingColumns() {
  logSection("2. Column existence probes");
  const columns = [
    "course_id",
    "name",
    "price",
    "location",
    "is_open",
    "sort_order",
    "class_id",
  ];
  for (const col of columns) {
    const { error } = await admin.from("sessions").select(col).limit(1);
    console.log(
      col + ":",
      error ? `MISSING/ERROR → ${error.code} ${error.message}` : "OK",
    );
  }
}

async function main() {
  logSection("Environment");
  console.log("URL:", url);
  console.log("Using service role:", Boolean(serviceKey));

  await inspectSessionsSchema();
  await probeMissingColumns();

  const courseId = await getSampleCourseId();
  if (!courseId) {
    console.error("Cannot continue without a course id");
    process.exit(1);
  }

  logSection("3. Insert probe (same shape as mapSessionToDb)");
  const payload = buildInsertPayload(courseId);

  // Service/admin client (bypasses RLS if service key)
  await probeInsert("service/anon admin client", admin, payload);

  if (serviceKey) {
    const anonClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    logSection("4. Insert probe with ANON key (simulates unauthenticated RLS)");
    await probeInsert("anon client (no auth)", anonClient, payload);
  }

  logSection("5. Legacy-only payload (no new columns)");
  const legacyPayload = {
    class_id: null,
    date: "2099-01-02",
    start_time: "09:00",
    end_time: "10:00",
    capacity: 5,
    remaining_capacity: 5,
    status: "open",
    notes: "legacy probe",
  };
  await probeInsert("legacy columns only", admin, legacyPayload);

  logSection("Done");
}

main().catch((err) => {
  console.error("Script crashed:", err);
  process.exit(1);
});
