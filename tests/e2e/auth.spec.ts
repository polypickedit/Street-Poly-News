import { test, expect } from "@playwright/test";
import { seedTestFixture, seedTestCredentials } from "../helpers/seed";
import { authenticate } from "./utils";

test.beforeAll(async () => {
  await seedTestFixture();
});

test("admin user can sign in and reach the dashboard", async ({ page }) => {
  await authenticate(page, seedTestCredentials.admin.email, seedTestCredentials.admin.password);
  await page.waitForURL("**/admin");
  await expect(page.getByText(/Pending Submissions/i)).toBeVisible();
});
