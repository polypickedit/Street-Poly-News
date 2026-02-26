import { CANONICAL_SUPABASE_PROJECT_REF } from "@/lib/supabase-env";

/**
 * Utility to clean up stale Supabase auth tokens from localStorage.
 * This prevents ghost sessions from previous projects/environments from persisting.
 */
export function cleanupStaleAuthTokens() {
  const EXPECTED_KEY_PREFIX = `sb-${CANONICAL_SUPABASE_PROJECT_REF}-auth-token`;

  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Find keys that look like Supabase auth tokens (sb-*-auth-token)
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        // If it doesn't match our expected project ref, mark for removal
        if (key !== EXPECTED_KEY_PREFIX) {
          keysToRemove.push(key);
        }
      }
    }

    if (keysToRemove.length > 0) {
      console.warn(`[Auth Cleanup] Removing ${keysToRemove.length} stale auth tokens:`, keysToRemove);
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  } catch (error) {
    console.error("[Auth Cleanup] Failed to cleanup stale tokens:", error);
  }
}
