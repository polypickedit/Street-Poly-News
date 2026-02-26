export const CANONICAL_SUPABASE_PROJECT_REF =
  import.meta.env.EXPECTED_SUPABASE_PROJECT_REF?.trim() || "cjodbnsjggslngnzwxsv";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  "";

export function extractSupabaseProjectRef(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

export function assertCanonicalSupabaseProject(url: string, context: string): string {
  const currentRef = extractSupabaseProjectRef(url);
  if (!currentRef) {
    throw new Error(`[${context}] Invalid VITE_SUPABASE_URL: "${url}"`);
  }

  if (currentRef !== CANONICAL_SUPABASE_PROJECT_REF) {
    throw new Error(
      `[${context}] Supabase project ref mismatch: expected "${CANONICAL_SUPABASE_PROJECT_REF}", got "${currentRef}" from VITE_SUPABASE_URL="${url}".`
    );
  }

  return currentRef;
}

