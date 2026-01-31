import { serviceRoleClient } from "./supabase";

const NORMAL_EMAIL = "test-framework-user@streetpoly.local";
const ADMIN_EMAIL = "test-framework-admin@streetpoly.local";
const TEST_PASSWORD = "Test1234!";

const TEST_ACCOUNT_NORMAL_ID = "00000000-0000-0000-0000-0000000000a1";
const TEST_ACCOUNT_ADMIN_ID = "00000000-0000-0000-0000-0000000000a2";
const TEST_ARTIST_ID = "00000000-0000-0000-0000-0000000000b1";
const TEST_SUBMISSION_ID = "00000000-0000-0000-0000-0000000000c1";
const TEST_PAYMENT_INTENT_ID = "pi_test_session";
const TEST_PAYMENT_ID = "00000000-0000-0000-0000-0000000000d1";

interface FixtureUser {
  id: string;
  email: string;
  password: string;
}

export interface SeedFixture {
  normal: FixtureUser;
  admin: FixtureUser;
  slotId: string;
  submissionId: string;
  paymentIntentId: string;
  outletIds: string[];
}

let cachedFixture: SeedFixture | null = null;

async function ensureUser(email: string): Promise<FixtureUser> {
  const { data: existing } = await serviceRoleClient.auth.admin.getUserByEmail(email);
  if (existing?.user) {
    await serviceRoleClient.auth.admin.updateUserById(existing.user.id, { password: TEST_PASSWORD });
    return {
      id: existing.user.id,
      email,
      password: TEST_PASSWORD,
    };
  }

  const { data: created } = await serviceRoleClient.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { test_marker: "streetpoly-framework" },
  });

  if (!created?.user) {
    throw new Error(`Failed to create user ${email}`);
  }

  return {
    id: created.user.id,
    email,
    password: TEST_PASSWORD,
  };
}

async function assignRole(userId: string, roleName: string) {
  const { data: role } = await serviceRoleClient
    .from("roles")
    .select("id")
    .eq("name", roleName)
    .limit(1)
    .single();

  if (!role?.id) {
    throw new Error(`Role ${roleName} not found`);
  }

  await serviceRoleClient.from("user_roles").upsert({
    user_id: userId,
    role_id: role.id,
  }, { onConflict: "user_id,role_id" });
}

async function ensureMediaOutlets(): Promise<string[]> {
  const { data } = await serviceRoleClient
    .from("media_outlets")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(2);

  return (data ?? []).map((outlet) => outlet.id);
}

async function ensureSlot(): Promise<string> {
  const { data: slot, error } = await serviceRoleClient
    .from("slots")
    .select("id")
    .eq("slug", "new-music-monday")
    .limit(1)
    .single();

  if (error || !slot) {
    throw new Error("Unable to locate the test slot");
  }

  return slot.id;
}

async function ensureArtist(userId: string): Promise<string> {
  await serviceRoleClient.from("artists").upsert({
    id: TEST_ARTIST_ID,
    name: "Test Artist",
    email: "test-artist@streetpoly.local",
    user_id: userId,
  }, { onConflict: "id" });

  return TEST_ARTIST_ID;
}

export async function seedTestFixture(): Promise<SeedFixture> {
  if (cachedFixture) return cachedFixture;

  const normal = await ensureUser(NORMAL_EMAIL);
  const admin = await ensureUser(ADMIN_EMAIL);
  await assignRole(admin.id, "admin");

  await serviceRoleClient.from("accounts").upsert([
    { id: TEST_ACCOUNT_NORMAL_ID, name: "Normal Test Account", type: "individual", owner_user_id: normal.id },
    { id: TEST_ACCOUNT_ADMIN_ID, name: "Admin Test Account", type: "individual", owner_user_id: admin.id },
  ], { onConflict: "id" });

  await serviceRoleClient.from("account_members").upsert([
    { account_id: TEST_ACCOUNT_NORMAL_ID, user_id: normal.id, role: "owner" },
    { account_id: TEST_ACCOUNT_ADMIN_ID, user_id: admin.id, role: "owner" },
  ], { onConflict: "account_id,user_id" });

  const slotId = await ensureSlot();
  const outletIds = await ensureMediaOutlets();
  await ensureArtist(normal.id);

  await serviceRoleClient.from("submissions").upsert({
    id: TEST_SUBMISSION_ID,
    artist_id: TEST_ARTIST_ID,
    slot_id: slotId,
    account_id: TEST_ACCOUNT_NORMAL_ID,
    user_id: normal.id,
    track_title: "Test Submission",
    artist_name: "Test Artist",
    spotify_track_url: "https://youtu.be/test",
    release_date: new Date().toISOString(),
    genre: "experimental",
    mood: "energetic",
    bpm: 120,
    status: "approved",
    payment_status: "paid",
    payment_type: "stripe",
    paid_at: new Date().toISOString(),
    submission_type: "music",
    notes_internal: "seeded for integration tests",
    distribution_targets: outletIds,
    content_bundle: { teaser: "Test" },
  }, { onConflict: "id" });

  await serviceRoleClient.from("payments").upsert({
    id: TEST_PAYMENT_ID,
    submission_id: TEST_SUBMISSION_ID,
    stripe_payment_intent_id: TEST_PAYMENT_INTENT_ID,
    amount_cents: 5500,
    currency: "usd",
    status: "succeeded",
  }, { onConflict: "id" });

  const distributionRows = outletIds.map((outletId) => ({
    submission_id: TEST_SUBMISSION_ID,
    outlet_id: outletId,
    status: "pending",
    paid: true,
  }));

  await serviceRoleClient.from("submission_distribution").upsert(distributionRows, { onConflict: "submission_id,outlet_id" });

  await serviceRoleClient.from("slot_entitlements").upsert({
    user_id: normal.id,
    slot_id: slotId,
    source: "purchase",
    is_active: true,
  }, { onConflict: "user_id,slot_id" });

  cachedFixture = {
    normal,
    admin,
    slotId,
    submissionId: TEST_SUBMISSION_ID,
    paymentIntentId: TEST_PAYMENT_INTENT_ID,
    outletIds,
  };

  return cachedFixture;
}

export const seedTestCredentials = {
  normal: { email: NORMAL_EMAIL, password: TEST_PASSWORD },
  admin: { email: ADMIN_EMAIL, password: TEST_PASSWORD },
};
