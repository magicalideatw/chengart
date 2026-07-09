import crypto from "crypto";

function ecpayEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

export function createCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string,
): string {
  const sortedKeys = Object.keys(params)
    .filter((key) => key !== "CheckMacValue" && params[key] !== undefined)
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

  const paramString = sortedKeys.map((key) => `${key}=${params[key]}`).join("&");
  const raw = `HashKey=${hashKey}&${paramString}&HashIV=${hashIV}`;
  const encoded = ecpayEncode(raw).toLowerCase();

  return crypto.createHash("sha256").update(encoded).digest("hex").toUpperCase();
}

export function verifyCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string,
): boolean {
  const received = params.CheckMacValue;
  if (!received) return false;

  const expected = createCheckMacValue(params, hashKey, hashIV);
  return expected === received;
}

export function formBodyToRecord(body: FormData | URLSearchParams): Record<string, string> {
  const record: Record<string, string> = {};

  body.forEach((value, key) => {
    record[key] = String(value);
  });

  return record;
}
