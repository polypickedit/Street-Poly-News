import { describe, expect, it, beforeAll } from "vitest";
import { signInUser, serviceRoleClient } from "../helpers/supabase";
import { seedTestFixture } from "../helpers/seed";

describe("Supabase RLS and health checks", () => {
  let fixture: Awaited<ReturnType<typeof seedTestFixture>>;
  let normalClient: Awaited<ReturnType<typeof signInUser>>;
  let adminClient: Awaited<ReturnType<typeof signInUser>>;

  beforeAll(async () => {
    fixture = await seedTestFixture();
    normalClient = await signInUser(fixture.normal.email, fixture.normal.password);
    adminClient = await signInUser(fixture.admin.email, fixture.admin.password);
  });

  it("lets the seeded user read their own submission but not others", async () => {
    const { data: own } = await normalClient
      .from("submissions")
      .select("id")
      .eq("user_id", fixture.normal.id);

    expect(own?.some((row: { id: string }) => row.id === fixture.submissionId)).toBe(true);

    const { data: others } = await normalClient
      .from("submissions")
      .select("id")
      .neq("user_id", fixture.normal.id)
      .limit(5);

    expect(others?.length).toBe(0);
  });

  it("prevents normal users from reading distribution rows", async () => {
    const { error } = await normalClient.from("submission_distribution").select("id");
    expect(error).toBeTruthy();
  });

  it("allows admins to inspect payments and distributions", async () => {
    const { data: payments } = await adminClient.from("payments").select("id,payment_status");
    expect(payments?.length).toBeGreaterThanOrEqual(1);

    const { data: distributions } = await adminClient.from("submission_distribution").select("id,outlet_id");
    expect(distributions?.length).toBeGreaterThanOrEqual(1);
  });

  it("reports a healthy submission state via the heartbeat query", async () => {
    const { data } = await serviceRoleClient.rpc("submission_health", {
      submission_id: fixture.submissionId,
    });

    const row = (data as Array<Record<string, unknown>>)?.[0];
    expect(row).toBeDefined();
    expect(row?.payment_status).toBe("paid");
    expect(row?.paid_at).toBeTruthy();
    expect(Number(row?.paid_payments ?? 0)).toBeGreaterThanOrEqual(1);
    expect(Number(row?.distribution_rows ?? 0)).toBe(fixture.outletIds.length);
  });
});
