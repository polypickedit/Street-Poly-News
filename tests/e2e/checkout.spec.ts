import { test, expect } from "@playwright/test";
import { seedTestFixture, seedTestCredentials } from "../helpers/seed";
import { authenticate } from "./utils";

test.beforeAll(async () => {
  await seedTestFixture();
});

test("booking form surfaces checkout modal", async ({ page }) => {
  await authenticate(page, seedTestCredentials.normal.email, seedTestCredentials.normal.password);
  await page.goto("/booking");
  await page.getByRole("button", { name: /Submit Your Track/i }).click();
  await expect(page.getByText(/New Music Monday Submission/i)).toBeVisible();
  await expect(page.getByText(/Estimated Total/i)).toBeVisible();
});
