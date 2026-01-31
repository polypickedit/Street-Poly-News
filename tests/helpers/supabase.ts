import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const noopStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => null,
  removeItem: (_key: string) => null,
};

function ensureEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is required for tests.`);
  }
  return value;
}

const SUPABASE_URL = ensureEnv("SUPABASE_URL");
const SUPABASE_ANON_KEY = ensureEnv("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = ensureEnv("SUPABASE_SERVICE_ROLE_KEY");

export const serviceRoleClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, storage: noopStorage },
});

export function createAnonymousClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, storage: noopStorage },
  });
}

export async function signInUser(email: string, password: string): Promise<SupabaseClient> {
  const client = createAnonymousClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}
