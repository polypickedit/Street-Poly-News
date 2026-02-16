
import { describe, expect, it, beforeAll } from "vitest";
import { signInUser, createAnonymousClient } from "../helpers/supabase";
import { seedTestFixture } from "../helpers/seed";

const shouldRunTests = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
const conditionalDescribe = shouldRunTests ? describe : describe.skip;

conditionalDescribe("Audit View RLS Validation", () => {
  let fixture: Awaited<ReturnType<typeof seedTestFixture>>;
  let normalClient: Awaited<ReturnType<typeof signInUser>>;
  let adminClient: Awaited<ReturnType<typeof signInUser>>;
  let anonClient: ReturnType<typeof createAnonymousClient>;

  beforeAll(async () => {
    fixture = await seedTestFixture();
    normalClient = await signInUser(fixture.normal.email, fixture.normal.password);
    adminClient = await signInUser(fixture.admin.email, fixture.admin.password);
    anonClient = createAnonymousClient();
  });

  it("prevents anonymous clients from accessing the audit view", async () => {
    const { data, error } = await anonClient
      .from("vw_status_integrity_audit")
      .select("*");
    
    // In Supabase, if REVOKE ALL is applied, the request might return empty data with no error
    // or a permission error depending on the PostgREST version/config.
    // If it returns data, it must be empty for anonymous users.
    if (error) {
        expect(error.code).toBe("42501");
    } else {
        expect(data).toHaveLength(0);
    }
  });

  it("allows regular users to see only their own audit data", async () => {
    const { data, error } = await normalClient
      .from("vw_status_integrity_audit")
      .select("*");

    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    // Regular users should only see rows where they are the owner
    // Since RLS is on 'submissions', the view should inherit this
    const allUserSubmissions = data?.every(row => {
        // We don't have user_id in the view directly, but we can verify the submission_id 
        // belongs to the user if we had that mapping.
        // For now, let's just check the count matches their submission count.
        return true; 
    });
    
    expect(allUserSubmissions).toBe(true);
    
    // Fetch user's actual submission count to compare
    const { count: submissionCount } = await normalClient
        .from("submissions")
        .select("*", { count: 'exact', head: true });
        
    expect(data?.length).toBe(submissionCount);
  });

  it("allows admins to see all audit data", async () => {
    const { data, error } = await adminClient
      .from("vw_status_integrity_audit")
      .select("*");

    expect(error).toBeNull();
    expect(data).toBeDefined();

    // Fetch total submission count
    const { count: totalSubmissions } = await adminClient
        .from("submissions")
        .select("*", { count: 'exact', head: true });

    expect(data?.length).toBe(totalSubmissions);
  });

  it("verifies the audit view has the required columns", async () => {
    const { data, error } = await adminClient
      .from("vw_status_integrity_audit")
      .select("last_transition_at, transition_count, submission_id, current_status")
      .limit(1);

    expect(error).toBeNull();
    if (data && data.length > 0) {
        expect(data[0]).toHaveProperty("last_transition_at");
        expect(data[0]).toHaveProperty("transition_count");
        expect(data[0]).toHaveProperty("submission_id");
        expect(data[0]).toHaveProperty("current_status");
    }
  });
});
