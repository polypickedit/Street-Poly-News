import { readFileSync } from "node:fs";
import path from "node:path";
import { type StripeEventLike } from "../../supabase/functions/stripe-webhook/handler";

function load(name: string): StripeEventLike {
  const fixture = readFileSync(path.join("tests", "fixtures", "stripe", name), "utf-8");
  return JSON.parse(fixture) as StripeEventLike;
}

export const checkoutSessionCompleted = load("checkout.session.completed.json");
export const paymentIntentSucceeded = load("payment_intent.succeeded.json");
