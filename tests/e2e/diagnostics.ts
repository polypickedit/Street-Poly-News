import { expect, Page } from "@playwright/test";

type DiagnosticsSnapshot = {
  path: string;
  isFetching: number;
  isMutating: number;
  activeQueries: Array<{ key: string; durationMs: number }>;
  auth: {
    status: string;
    rolesLoaded: boolean;
    userId: string | null;
  };
  timestamp: string;
};

export async function getDiagnosticsSnapshot(page: Page): Promise<DiagnosticsSnapshot | null> {
  return page.evaluate(() => {
    const api = window.__APP_DIAGNOSTICS__;
    if (!api || typeof api.getSnapshot !== "function") {
      return null;
    }
    return api.getSnapshot();
  });
}

export async function waitForNoStuckQueries(
  page: Page,
  options?: {
    timeoutMs?: number;
    maxActiveQueryDurationMs?: number;
  }
): Promise<DiagnosticsSnapshot> {
  const timeoutMs = options?.timeoutMs ?? 15_000;
  const maxActiveQueryDurationMs = options?.maxActiveQueryDurationMs ?? 8_000;

  await expect
    .poll(
      async () => {
        const snapshot = await getDiagnosticsSnapshot(page);
        if (!snapshot) return { ok: false, reason: "diagnostics-unavailable", snapshot: null as DiagnosticsSnapshot | null };

        const hasStuck = snapshot.activeQueries.some((q) => q.durationMs > maxActiveQueryDurationMs);
        return {
          ok: !hasStuck,
          reason: hasStuck ? "stuck-query" : "ok",
          snapshot,
        };
      },
      { timeout: timeoutMs }
    )
    .toMatchObject({ ok: true, reason: "ok" });

  const finalSnapshot = await getDiagnosticsSnapshot(page);
  if (!finalSnapshot) {
    throw new Error("Diagnostics unavailable after wait");
  }
  return finalSnapshot;
}
