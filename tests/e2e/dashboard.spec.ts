import { test, expect } from "@playwright/test";
import { seedTestFixture, seedTestCredentials } from "../helpers/seed";
import { authenticate } from "./utils";

test.beforeAll(async () => {
  await seedTestFixture();
});

test("dashboard surfaces the seeded submission", async ({ page }) => {
  await authenticate(page, seedTestCredentials.normal.email, seedTestCredentials.normal.password);
  await page.goto("/dashboard");
  await expect(page.getByText(/Test Submission/i)).toBeVisible();
  await expect(page.getByText(/Paid/i)).toBeVisible();
});
