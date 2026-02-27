#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const requiredCanonicalHost =
  process.env.REQUIRED_CANONICAL_HOST?.trim().toLowerCase() || "streetpolynews.com";
const expectedRef = process.env.EXPECTED_SUPABASE_PROJECT_REF?.trim() || "";
const url = process.env.VITE_SUPABASE_URL?.trim() || "";
const canonicalHost = process.env.VITE_CANONICAL_HOST?.trim().toLowerCase() || "";
const canonicalProtocol = process.env.VITE_CANONICAL_PROTOCOL?.trim().toLowerCase() || "";
const webhookUrl = process.env.STRIPE_WEBHOOK_URL?.trim() || "";
const requireServerSecrets = process.env.VERIFY_SERVER_SECRETS === "1";

const requiredEdgeFunctions = [
  "create-checkout-session",
  "stripe-webhook",
  "track-click",
  "youtube-feed",
  "youtube-feed-refresh",
];

const requiredServerSecrets = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

function fail(message) {
  console.error(`[validate-release-invariants] ${message}`);
  process.exit(1);
}

function extractProjectRef(value) {
  try {
    return new URL(value).hostname.toLowerCase().split(".")[0] ?? "";
  } catch {
    return "";
  }
}

const actualRef = extractProjectRef(url);

console.log(`[validate-release-invariants] expected_ref=${expectedRef || "unset"}`);
console.log(`[validate-release-invariants] actual_ref=${actualRef || "unknown"}`);
console.log(`[validate-release-invariants] canonical_host=${canonicalHost || "unset"}`);
console.log(`[validate-release-invariants] canonical_protocol=${canonicalProtocol || "unset"}`);

if (!url || !actualRef) {
  fail("Missing or invalid VITE_SUPABASE_URL.");
}

if (!expectedRef) {
  fail("EXPECTED_SUPABASE_PROJECT_REF is required.");
}

if (actualRef !== expectedRef) {
  fail(`Supabase project ref mismatch: expected "${expectedRef}", got "${actualRef}".`);
}

if (!canonicalHost) {
  fail("VITE_CANONICAL_HOST is required.");
}

if (canonicalHost !== requiredCanonicalHost) {
  fail(`Canonical host mismatch: expected "${requiredCanonicalHost}", got "${canonicalHost}".`);
}

if (canonicalProtocol !== "https") {
  fail(`VITE_CANONICAL_PROTOCOL must be "https", got "${canonicalProtocol || "unset"}".`);
}

for (const fnName of requiredEdgeFunctions) {
  const fnPath = path.join(process.cwd(), "supabase", "functions", fnName);
  if (!fs.existsSync(fnPath)) {
    fail(`Missing required Edge Function directory: supabase/functions/${fnName}`);
  }
}

if (webhookUrl) {
  const expectedWebhookUrl = `https://${expectedRef}.functions.supabase.co/stripe-webhook`;
  if (webhookUrl !== expectedWebhookUrl) {
    fail(`Stripe webhook URL mismatch: expected "${expectedWebhookUrl}", got "${webhookUrl}".`);
  }
  console.log(`[validate-release-invariants] stripe_webhook_url=${webhookUrl}`);
}

if (requireServerSecrets) {
  const missingSecrets = requiredServerSecrets.filter((key) => !process.env[key]?.trim());
  if (missingSecrets.length > 0) {
    fail(`Missing required server secrets: ${missingSecrets.join(", ")}`);
  }
}

console.log(
  `[validate-release-invariants] Edge Functions present: ${requiredEdgeFunctions.join(", ")}`
);
console.log("[validate-release-invariants] Release invariants passed.");
