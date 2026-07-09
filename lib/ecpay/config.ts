import { siteConfig } from "@/lib/data/site";

export type EcpayEnv = "staging" | "production";

export function getEcpayEnv(): EcpayEnv {
  const env = process.env.ECPAY_ENV?.toLowerCase();
  if (env === "production" || env === "prod") return "production";
  return "staging";
}

export function isProductionEcpay(): boolean {
  return getEcpayEnv() === "production";
}

export function isEcpayConfigured(): boolean {
  return Boolean(
    process.env.ECPAY_MERCHANT_ID &&
      process.env.ECPAY_HASH_KEY &&
      process.env.ECPAY_HASH_IV,
  );
}

export function getPublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
  return raw.replace(/\/$/, "");
}

export function getEcpayConfig() {
  const merchantId = process.env.ECPAY_MERCHANT_ID;
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIv = process.env.ECPAY_HASH_IV;

  if (!merchantId || !hashKey || !hashIv) {
    return null;
  }

  const env = getEcpayEnv();
  const actionUrl =
    env === "production"
      ? "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5"
      : "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";

  const siteUrl = getPublicSiteUrl();

  if (env === "production" && /localhost|127\.0\.0\.1/.test(siteUrl)) {
    console.warn(
      "ECPay production: NEXT_PUBLIC_SITE_URL 不可使用 localhost，請改為正式網域（https://chengart.tw）",
    );
  }

  return {
    merchantId,
    hashKey,
    hashIv,
    env,
    actionUrl,
    returnUrl: `${siteUrl}/api/payment/ecpay/callback`,
    orderResultUrl: `${siteUrl}/api/payment/ecpay/result`,
    clientBackUrl: `${siteUrl}/payment/cancel`,
  };
}

export function generateMerchantTradeNo(): string {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CA${timePart}${randomPart}`.slice(0, 20);
}

export function formatMerchantTradeDate(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());

  return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
}
