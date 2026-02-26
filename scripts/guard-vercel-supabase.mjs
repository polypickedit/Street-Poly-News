#!/usr/bin/env node

const expectedRef =
  process.env.EXPECTED_SUPABASE_PROJECT_REF?.trim() || "";
const requiredCanonicalHost =
  process.env.REQUIRED_CANONICAL_HOST?.trim().toLowerCase() || "streetpolynews.com";

const isVercel = process.env.VERCEL === "1";
const vercelEnv = process.env.VERCEL_ENV;

if (!isVercel) {
  console.log("[guard-vercel-supabase] Non-Vercel build detected. Skipping guard.");
  process.exit(0);
}

if (vercelEnv !== "production") {
  console.log(
    `[guard-vercel-supabase] VERCEL_ENV=${vercelEnv ?? "unknown"} (not production). Skipping strict production guard.`
  );
  process.exit(0);
}

const url = process.env.VITE_SUPABASE_URL?.trim();
if (!url) {
  console.error("[guard-vercel-supabase] Missing VITE_SUPABASE_URL in production build environment.");
  process.exit(1);
}

let actualRef = "";
try {
  actualRef = new URL(url).hostname.toLowerCase().split(".")[0] ?? "";
} catch {
  console.error(`[guard-vercel-supabase] Invalid VITE_SUPABASE_URL: "${url}".`);
  process.exit(1);
}

if (expectedRef && actualRef !== expectedRef) {
  console.error(
    `[guard-vercel-supabase] Ref mismatch:\n  expected_ref=${expectedRef}\n  actual_ref=${actualRef || "unknown"}\n  url=${url}`
  );
  process.exit(1);
}

const canonicalHost = process.env.VITE_CANONICAL_HOST?.trim().toLowerCase();
if (!canonicalHost) {
  console.error("[guard-vercel-supabase] Missing VITE_CANONICAL_HOST in production.");
  process.exit(1);
}

if (canonicalHost !== requiredCanonicalHost) {
  console.error(
    `[guard-vercel-supabase] Canonical host mismatch: expected "${requiredCanonicalHost}" but got "${canonicalHost}".`
  );
  process.exit(1);
}

const canonicalProtocol = process.env.VITE_CANONICAL_PROTOCOL?.trim().toLowerCase();
if (canonicalProtocol !== "https") {
  console.error(
    `[guard-vercel-supabase] VITE_CANONICAL_PROTOCOL must be "https" in production, got "${canonicalProtocol ?? "unset"}".`
  );
  process.exit(1);
}

console.log(
  `[guard-vercel-supabase] OK:\n  expected_ref=${expectedRef}\n  actual_ref=${actualRef}\n  canonical_host=${canonicalHost}\n  url=${url}`
);
