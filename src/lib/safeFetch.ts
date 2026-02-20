import { PostgrestError } from '@supabase/supabase-js';

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'details' in error &&
    'hint' in error &&
    'code' in error
  );
}

export function logSupabaseError(error: PostgrestError | Error) {
  console.error('Supabase Error:', error.message);
  if ('details' in error && (error as any).details) console.error('Details:', (error as any).details);
  if ('hint' in error && (error as any).hint) console.error('Hint:', (error as any).hint);
}

/**
 * Executes a Supabase query promise safely, suppressing AbortErrors.
 * If the query is aborted, it returns null.
 * If a PostgrestError occurs, it logs it and throws it (unless you want to suppress that too, but usually we want to know about DB errors).
 */
export async function safeFetch<T>(
  queryPromise: PromiseLike<{ data: T | null; error: PostgrestError | null }>
): Promise<T | null> {
  try {
    const { data, error } = await queryPromise;
    if (error) {
      // Supabase client sometimes returns error object for AbortError depending on version/context?
      // Usually it throws, but checking here just in case.
      if (isAbortError(error)) return null;
      
      logSupabaseError(error);
      throw error;
    }
    return data;
  } catch (err) {
    if (isAbortError(err)) {
      // Swallow abort error
      return null;
    }
    // Re-throw other errors
    if (isPostgrestError(err)) {
      logSupabaseError(err);
    } else {
      console.error("Unexpected error during Supabase query:", err);
    }
    throw err;
  }
}
