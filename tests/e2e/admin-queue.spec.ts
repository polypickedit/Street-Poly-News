import { test, expect } from "@playwright/test";
import { seedTestFixture, seedTestCredentials } from "../helpers/seed";
import { authenticate } from "./utils";

test.beforeAll(async () => {
  await seedTestFixture();
});

test("admin queue surface seeded submission", async ({ page }) => {
  await authenticate(page, seedTestCredentials.admin.email, seedTestCredentials.admin.password);
  await page.goto("/admin/submissions");
  await expect(page.getByText(/Showing \d+ results/i)).toBeVisible();
  await expect(page.getByText(/Test Submission/i)).toBeVisible();
});
