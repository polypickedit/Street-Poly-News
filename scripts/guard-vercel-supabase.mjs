#!/usr/bin/env node

const EXPECTED_PROJECT_REF = process.env.EXPECTED_SUPABASE_PROJECT_REF;

if (!EXPECTED_PROJECT_REF) {
  console.error("❌ Error: EXPECTED_SUPABASE_PROJECT_REF environment variable is not set.");
  process.exit(1);
}
const REQUIRED_CANONICAL_HOST =
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
  console.error(
    "[guard-vercel-supabase] Missing VITE_SUPABASE_URL in production build environment."
  );
  process.exit(1);
}

let hostname = "";
try {
  hostname = new URL(url).hostname.toLowerCase();
} catch {
  console.error(
    `[guard-vercel-supabase] Invalid VITE_SUPABASE_URL format: "${url}". Expected full URL.`
  );
  process.exit(1);
}

const projectRef = hostname.split(".")[0];
if (projectRef !== EXPECTED_PROJECT_REF) {
  console.error(
    `[guard-vercel-supabase] Ref mismatch: expected "${EXPECTED_PROJECT_REF}" but got "${projectRef}" from VITE_SUPABASE_URL=${url}`
  );
  process.exit(1);
}

const canonicalHost = process.env.VITE_CANONICAL_HOST?.trim().toLowerCase();
if (!canonicalHost) {
  console.error("[guard-vercel-supabase] Missing VITE_CANONICAL_HOST in production.");
  process.exit(1);
}

if (canonicalHost !== REQUIRED_CANONICAL_HOST) {
  console.error(
    `[guard-vercel-supabase] Canonical host mismatch: expected "${REQUIRED_CANONICAL_HOST}" but got "${canonicalHost}".`
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
  `[guard-vercel-supabase] OK: production build locked to ${EXPECTED_PROJECT_REF} with canonical host ${canonicalHost}.`
);
