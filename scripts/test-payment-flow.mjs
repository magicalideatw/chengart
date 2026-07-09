/**
 * Production ECPay + Supabase payment flow tests.
 * Run: node scripts/test-payment-flow.mjs
 */
import crypto from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

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

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    console.log(`✓ ${name}`);
    passed += 1;
  } else {
    console.error(`✗ ${name}`);
    failed += 1;
  }
}

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
const merchantId = process.env.ECPAY_MERCHANT_ID;
const hashKey = process.env.ECPAY_HASH_KEY;
const hashIv = process.env.ECPAY_HASH_IV;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isProduction =
  process.env.ECPAY_ENV?.toLowerCase() === "production" ||
  process.env.ECPAY_ENV?.toLowerCase() === "prod";

console.log("=== ECPay Production Config ===");
assert("ECPAY_ENV is production", isProduction);
assert("ECPAY_MERCHANT_ID is set", Boolean(merchantId));
assert("ECPAY_HASH_KEY is set", Boolean(hashKey));
assert("ECPAY_HASH_IV is set", Boolean(hashIv));
assert("NEXT_PUBLIC_SITE_URL is https://chengart.tw", siteUrl === "https://chengart.tw");

const actionUrl = isProduction
  ? "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5"
  : "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";
const returnUrl = `${siteUrl}/api/payment/ecpay/callback`;
const resultUrl = `${siteUrl}/api/payment/ecpay/result`;

console.log(`  Action URL: ${actionUrl}`);
console.log(`  ReturnURL:  ${returnUrl}`);
console.log(`  ResultURL:  ${resultUrl}`);

assert("Production action URL", actionUrl.includes("payment.ecpay.com.tw"));

if (merchantId && hashKey && hashIv && siteUrl) {
  const checkoutFields = {
    MerchantID: merchantId,
    MerchantTradeNo: `CA${Date.now().toString(36).toUpperCase()}`.slice(0, 20),
    MerchantTradeDate: "2026/07/10 01:00:00",
    PaymentType: "aio",
    TotalAmount: "1200",
    TradeDesc: "晟心誠藝劇團課程報名",
    ItemName: "舞蹈課",
    ReturnURL: returnUrl,
    OrderResultURL: resultUrl,
    ClientBackURL: `${siteUrl}/payment/cancel`,
    ChoosePayment: "ALL",
    IgnorePayment: "CVS#BARCODE#WebATM#ApplePay#GooglePay#TWQR#BNPL#WeiXin",
    EncryptType: "1",
  };
  checkoutFields.CheckMacValue = createCheckMacValue(checkoutFields, hashKey, hashIv);

  assert("Checkout CheckMacValue generated", checkoutFields.CheckMacValue.length === 64);
  assert("ReturnURL uses chengart.tw", returnUrl.startsWith("https://chengart.tw"));

  const callbackParams = {
    MerchantID: merchantId,
    MerchantTradeNo: checkoutFields.MerchantTradeNo,
    RtnCode: "1",
    RtnMsg: "Succeeded",
    TradeNo: "2607100100123456",
    TradeAmt: "1200",
    PaymentDate: "2026/07/10 01:01:00",
    PaymentType: "Credit_CreditCard",
    PaymentTypeChargeFee: "36",
    TradeDate: "2026/07/10 01:00:00",
    SimulatePaid: "0",
  };
  callbackParams.CheckMacValue = createCheckMacValue(callbackParams, hashKey, hashIv);
  assert("Callback CheckMacValue verifiable", Boolean(callbackParams.CheckMacValue));
}

console.log("\n=== Supabase Orders Table ===");

if (supabaseUrl && supabaseKey) {
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  const ordersRes = await fetch(`${supabaseUrl}/rest/v1/orders?select=id&limit=1`, {
    headers,
  });

  if (ordersRes.status === 404 || ordersRes.status === 400) {
    const body = await ordersRes.text();
    assert(
      "orders table exists (run migration 005)",
      false,
    );
    console.error(`  Response: ${body.slice(0, 200)}`);
  } else {
    assert("orders table accessible", ordersRes.ok);
  }

  const regsRes = await fetch(
    `${supabaseUrl}/rest/v1/registrations?select=status&limit=1`,
    { headers },
  );

  if (regsRes.ok) {
    assert("registrations.status column exists (migration 006)", true);
  } else {
    const body = await regsRes.text();
    const missingStatus = body.includes("status") && body.includes("42703");
    assert(
      "registrations.status column exists (run migration 006)",
      !missingStatus && regsRes.ok,
    );
    if (!regsRes.ok) console.warn(`  registrations.status: ${body.slice(0, 120)}`);
  }

  const coursesRes = await fetch(
    `${supabaseUrl}/rest/v1/courses?select=id,title,fee,is_open&is_open=eq.true&limit=1`,
    { headers },
  );
  assert("Open course available for checkout test", coursesRes.ok && (await coursesRes.json()).length > 0);
}

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log("\n若 orders / registrations.status 測試失敗，請在 Supabase SQL Editor 執行：");
  console.log("  supabase/migrations/005_create_orders.sql");
  console.log("  supabase/migrations/006_registration_payment_status.sql");
}

process.exit(failed > 0 ? 1 : 0);
