#!/usr/bin/env node

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const expectedRef =
  process.env.EXPECTED_SUPABASE_PROJECT_REF?.trim() || "cjodbnsjggslngnzwxsv";
const url = process.env.VITE_SUPABASE_URL?.trim() || "";

let actualRef = "";
if (url) {
  try {
    actualRef = new URL(url).hostname.toLowerCase().split(".")[0] ?? "";
  } catch {
    actualRef = "";
  }
}

console.log(`[validate-supabase-env] VITE_SUPABASE_URL=${url || "unset"}`);
console.log(`[validate-supabase-env] expected_ref=${expectedRef}`);
console.log(`[validate-supabase-env] actual_ref=${actualRef || "unknown"}`);

if (!url || !actualRef || actualRef !== expectedRef) {
  console.error("[validate-supabase-env] Supabase environment validation failed.");
  process.exit(1);
}

console.log("[validate-supabase-env] Supabase environment validation passed.");
