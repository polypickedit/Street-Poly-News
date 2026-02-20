import { test, expect } from "@playwright/test";
import { seedTestFixture, seedTestCredentials } from "../helpers/seed";
import { authenticate } from "./utils";
import { getDiagnosticsSnapshot, waitForNoStuckQueries } from "./diagnostics";

test.beforeAll(async () => {
  await seedTestFixture();
});

test("diagnostics are exposed and no route has long-running stuck queries", async ({ page }) => {
  await authenticate(page, seedTestCredentials.normal.email, seedTestCredentials.normal.password);

  const routes = ["/", "/booking", "/dashboard"];

  for (const route of routes) {
    await page.goto(route);

    const snapshot = await getDiagnosticsSnapshot(page);
    expect(snapshot, `Diagnostics unavailable for route ${route}`).not.toBeNull();

    const settled = await waitForNoStuckQueries(page, {
      timeoutMs: 20_000,
      maxActiveQueryDurationMs: 10_000,
    });

    expect(settled.path).toBe(route);
  }
});

test("admin routes avoid long-running stuck queries", async ({ page }) => {
  await authenticate(page, seedTestCredentials.admin.email, seedTestCredentials.admin.password);

  const routes = ["/admin", "/admin/queue"];

  for (const route of routes) {
    await page.goto(route);

    const snapshot = await getDiagnosticsSnapshot(page);
    expect(snapshot, `Diagnostics unavailable for route ${route}`).not.toBeNull();

    const settled = await waitForNoStuckQueries(page, {
      timeoutMs: 20_000,
      maxActiveQueryDurationMs: 10_000,
    });

    expect(settled.path).toBe(route);
  }
});
