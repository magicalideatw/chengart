#!/usr/bin/env node
/**
 * Sync .env.local variables to Vercel (production, preview, development).
 * Usage: node scripts/sync-vercel-env.mjs
 * Requires: vercel login && vercel link (or VERCEL_TOKEN)
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { spawnSync } from "child_process";

const envPath = resolve(process.cwd(), ".env.local");
const environments = ["production", "preview", "development"];

function parseEnvFile(filePath) {
  const vars = [];
  const content = readFileSync(filePath, "utf8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    vars.push({ key, value });
  }

  return vars;
}

function runVercel(args, input) {
  const result = spawnSync("npx", ["vercel@latest", ...args], {
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    cwd: process.cwd(),
  });

  return {
    ok: result.status === 0,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    status: result.status,
  };
}

function envExists(key, env) {
  const result = runVercel(["env", "ls", env], undefined);
  if (!result.ok) return false;
  return result.stdout.split("\n").some((line) => line.includes(key));
}

if (!existsSync(envPath)) {
  console.error(".env.local not found");
  process.exit(1);
}

const whoami = runVercel(["whoami"], undefined);
if (!whoami.ok) {
  console.error("Vercel CLI 未登入。請先執行: npx vercel login");
  process.exit(1);
}

console.log(`Vercel account: ${whoami.stdout.trim()}`);

const vars = parseEnvFile(envPath);
let added = 0;
let skipped = 0;
let failed = 0;

for (const { key, value } of vars) {
  const missingEnvs = environments.filter((env) => !envExists(key, env));

  if (missingEnvs.length === 0) {
    console.log(`⏭  ${key} — 已存在於所有環境，略過`);
    skipped += 1;
    continue;
  }

  console.log(`➕ ${key} → ${missingEnvs.join(", ")}`);

  const result = runVercel(
    ["env", "add", key, ...missingEnvs, "--yes"],
    value,
  );

  if (result.ok) {
    added += 1;
    console.log(`   ✓ 已新增`);
  } else {
    failed += 1;
    console.error(`   ✗ 失敗: ${(result.stderr || result.stdout).trim()}`);
  }
}

console.log(`\n完成: ${added} 新增, ${skipped} 略過, ${failed} 失敗`);

if (failed > 0) process.exit(1);

console.log("\n正在觸發 Production 重新部署…");
const deploy = runVercel(["deploy", "--prod", "--yes"], undefined);

if (deploy.ok) {
  const urlMatch = deploy.stdout.match(/https:\/\/[^\s]+/);
  console.log(deploy.stdout.trim());
  if (urlMatch) console.log(`\n部署完成: ${urlMatch[0]}`);
} else {
  console.error("部署失敗:", (deploy.stderr || deploy.stdout).trim());
  process.exit(1);
}
