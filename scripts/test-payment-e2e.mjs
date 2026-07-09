/**
 * End-to-end payment callback simulation (requires migrations 005+006 and dev server).
 * Run: npm run dev (separate terminal) && npm run test:payment:e2e
 */
import crypto from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

function ecpayEncode(value) {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

function createCheckMacValue(params, hashKey, hashIV) {
  const sortedKeys = Object.keys(params)
    .filter((key) => key !== "CheckMacValue")
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  const paramString = sortedKeys.map((key) => `${key}=${params[key]}`).join("&");
  const raw = `HashKey=${hashKey}&${paramString}&HashIV=${hashIV}`;
  return crypto.createHash("sha256").update(ecpayEncode(raw).toLowerCase()).digest("hex").toUpperCase();
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hashKey = process.env.ECPAY_HASH_KEY;
const hashIv = process.env.ECPAY_HASH_IV;
const merchantId = process.env.ECPAY_MERCHANT_ID;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const callbackBase = process.env.PAYMENT_TEST_CALLBACK_URL ?? siteUrl;

let passed = 0;
let failed = 0;

function assert(name, condition, detail) {
  if (condition) {
    console.log(`✓ ${name}`);
    passed += 1;
  } else {
    console.error(`✗ ${name}${detail ? `: ${detail}` : ""}`);
    failed += 1;
  }
}

if (!supabaseUrl || !supabaseKey || !hashKey || !hashIv || !merchantId) {
  console.error("Missing required env vars for e2e test");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("=== E2E Payment Callback Test ===\n");

const ordersProbe = await supabase.from("orders").select("id").limit(1);
assert("orders table exists", !ordersProbe.error, ordersProbe.error?.message);

const statusProbe = await supabase.from("registrations").select("status").limit(1);
assert(
  "registrations.status column exists",
  !statusProbe.error,
  statusProbe.error?.message,
);

if (ordersProbe.error || statusProbe.error) {
  console.log("\n請先在 Supabase SQL Editor 執行：");
  console.log("  supabase/migrations/005_create_orders.sql");
  console.log("  supabase/migrations/006_registration_payment_status.sql");
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(1);
}

const { data: course, error: courseError } = await supabase
  .from("courses")
  .select("id, title, fee, is_open, capacity")
  .eq("is_open", true)
  .limit(1)
  .maybeSingle();

assert("open course found", Boolean(course) && !courseError, courseError?.message);

if (!course) {
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(1);
}

const merchantTradeNo = `CA${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`.slice(0, 20);
const formData = {
  name: "測試家長",
  phone: "0912345678",
  email: "test-payment@example.com",
  studentName: "測試學員",
  studentAge: "8",
  isFirstTime: "yes",
  note: "ECPay e2e test – safe to delete",
};

const { data: order, error: orderError } = await supabase
  .from("orders")
  .insert({
    merchant_trade_no: merchantTradeNo,
    course_id: course.id,
    course_title: course.title,
    amount: course.fee,
    status: "pending",
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    form_data: formData,
  })
  .select("*")
  .single();

assert("pending order created", Boolean(order) && !orderError, orderError?.message);

if (!order) {
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(1);
}

const callbackParams = {
  MerchantID: merchantId,
  MerchantTradeNo: merchantTradeNo,
  RtnCode: "1",
  RtnMsg: "Succeeded",
  TradeNo: `E2E${Date.now()}`,
  TradeAmt: String(course.fee),
  PaymentDate: "2026/07/10 01:30:00",
  PaymentType: "Credit_CreditCard",
  PaymentTypeChargeFee: "0",
  TradeDate: "2026/07/10 01:29:00",
  SimulatePaid: "0",
};
callbackParams.CheckMacValue = createCheckMacValue(callbackParams, hashKey, hashIv);

const callbackUrl = `${callbackBase.replace(/\/$/, "")}/api/payment/ecpay/callback`;
console.log(`  Callback URL: ${callbackUrl}`);

let callbackResponse;
try {
  callbackResponse = await fetch(callbackUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(callbackParams).toString(),
  });
} catch (error) {
  callbackResponse = null;
  assert(
    "callback endpoint reachable",
    false,
    `${error.message} — 請執行 npm run dev 或設定 PAYMENT_TEST_CALLBACK_URL`,
  );
}

if (callbackResponse) {
  const body = await callbackResponse.text();
  assert("callback returns 200", callbackResponse.status === 200, `status ${callbackResponse.status}`);
  assert("callback returns 1|OK", body.trim() === "1|OK", body);
}

const { data: paidOrder } = await supabase
  .from("orders")
  .select("status, registration_id, payment_method")
  .eq("id", order.id)
  .single();

assert("order status is paid", paidOrder?.status === "paid", paidOrder?.status ?? "missing");

const { data: registration } = await supabase
  .from("registrations")
  .select("id, status, order_id, email")
  .eq("order_id", order.id)
  .maybeSingle();

assert("registration created with paid status", registration?.status === "paid", registration?.status);
assert("registration linked to order", registration?.order_id === order.id);

console.log(`\n${passed} passed, ${failed} failed`);

if (registration?.id) {
  console.log("\n清理測試資料…");
  await supabase.from("registrations").delete().eq("id", registration.id);
  await supabase.from("orders").delete().eq("id", order.id);
  console.log("已刪除測試 order / registration");
}

process.exit(failed > 0 ? 1 : 0);
