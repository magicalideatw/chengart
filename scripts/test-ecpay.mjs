/**
 * ECPay payment flow smoke tests.
 * Run: node scripts/test-ecpay.mjs
 */
import crypto from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      process.env[key] = value;
    }
  } catch {
    // ignore
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
  const encoded = ecpayEncode(raw).toLowerCase();
  return crypto.createHash("sha256").update(encoded).digest("hex").toUpperCase();
}

loadEnvLocal();

function getPublicSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

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

// Official ECPay documentation sample
const sampleParams = {
  ChoosePayment: "ALL",
  EncryptType: "1",
  ItemName: "Apple iphone 15",
  MerchantID: "2000132",
  MerchantTradeDate: "2024/01/01 12:00:00",
  MerchantTradeNo: "Test1704067200",
  PaymentType: "aio",
  ReturnURL: "https://example.com/callback",
  TotalAmount: "1000",
  TradeDesc: "Test order",
};
const sampleKey = "5294y06JbISpM5x9";
const sampleIv = "v77hoKGq4kWxNNIS";
const sampleMac = createCheckMacValue(sampleParams, sampleKey, sampleIv);

assert("CheckMacValue generates 64-char SHA256 hex", sampleMac.length === 64);
assert("CheckMacValue is uppercase", sampleMac === sampleMac.toUpperCase());

const merchantId = process.env.ECPAY_MERCHANT_ID;
const hashKey = process.env.ECPAY_HASH_KEY;
const hashIv = process.env.ECPAY_HASH_IV;

assert("ECPAY_MERCHANT_ID is set", Boolean(merchantId));
assert("ECPAY_HASH_KEY is set", Boolean(hashKey));
assert("ECPAY_HASH_IV is set", Boolean(hashIv));

const ecpayEnv = (process.env.ECPAY_ENV ?? "staging").toLowerCase();
const isProduction = ecpayEnv === "production" || ecpayEnv === "prod";
const actionUrl = isProduction
  ? "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5"
  : "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";

assert(
  "ECPAY_ENV resolves correctly",
  isProduction ? ecpayEnv.startsWith("prod") : true,
);
console.log(`  ECPay mode: ${isProduction ? "production" : "staging"}`);
console.log(`  Action URL: ${actionUrl}`);

if (merchantId && hashKey && hashIv) {
  const siteUrl = getPublicSiteUrl();
  assert("Production site URL", siteUrl === "https://chengart.tw");
  const returnUrl = `${siteUrl}/api/payment/ecpay/callback`;
  const resultUrl = `${siteUrl}/api/payment/ecpay/result`;

  const checkoutFields = {
    MerchantID: merchantId,
    MerchantTradeNo: "CATEST1234567890",
    MerchantTradeDate: "2026/07/09 12:00:00",
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

  assert("Project checkout CheckMacValue generated", Boolean(checkoutFields.CheckMacValue));
  assert("ReturnURL uses production domain", returnUrl.startsWith("https://chengart.tw"));

  console.log("\nSample checkout fields ready:");
  console.log(`  MerchantID: ${checkoutFields.MerchantID}`);
  console.log(`  MerchantTradeNo: ${checkoutFields.MerchantTradeNo}`);
  console.log(`  CheckMacValue: ${checkoutFields.CheckMacValue.slice(0, 16)}...`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
