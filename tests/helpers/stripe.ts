import { readFileSync } from "node:fs";
import path from "node:path";

type StripeRawEvent = Record<string, unknown>;

function load(name: string): StripeRawEvent {
  const fixture = readFileSync(path.join("tests", "fixtures", "stripe", name), "utf-8");
  return JSON.parse(fixture);
}

export const checkoutSessionCompleted = load("checkout.session.completed.json");
export const paymentIntentSucceeded = load("payment_intent.succeeded.json");
