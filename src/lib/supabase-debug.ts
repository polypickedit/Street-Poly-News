
import { PostgrestError } from '@supabase/supabase-js';

export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  // Handle DOMException: AbortError
  if (error instanceof Error && (error.name === 'AbortError' || error.message?.includes('abort'))) {
    return true;
  }
  // Handle potential non-Error objects that look like aborts
  const err = error as { name?: string; message?: string; code?: string };
  return (
    err.name === 'AbortError' || 
    err.message?.toLowerCase().includes('abort') === true ||
    err.code === '20' // DOMException code
  );
}

/**
 * Wraps a Supabase query to ensure errors are thrown and logged.
 * 
 * @param queryPromise - The promise returned by a Supabase query builder.
 * @returns The data from the query if successful.
 * @throws The error from the query if one occurred.
 */
export async function safeQuery<T>(
  queryPromise: PromiseLike<{ data: T | null; error: PostgrestError | null }>
): Promise<T | null> {
  try {
    const { data, error } = await queryPromise;

    if (error) {
      // AbortError is a lifecycle event, not a failure.
      // Do not log as Supabase error and do not throw.
      if (isAbortError(error)) {
        return null;
      }
      logSupabaseError(error);
      throw error;
    }

    return data;
  } catch (err) {
    if (isAbortError(err)) {
      // AbortError is a lifecycle event, not a failure.
      // We return null so the calling code can exit gracefully.
      return null;
    }

    if (isPostgrestError(err)) {
      logSupabaseError(err);
    } else {
      console.error("Unexpected error during Supabase query:", err);
    }
    throw err;
  }
}

/**
 * Type guard to check if an error is a PostgrestError.
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'details' in error &&
    'hint' in error &&
    'code' in error
  );
}

/**
 * Logs a structured Supabase error to the console.
 */
export function logSupabaseError(error: PostgrestError) {
  console.error("❌ Supabase Error:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
}

/**
 * Wraps a Supabase query that returns a count.
 * 
 * @param queryPromise - The promise returned by a Supabase query builder with count option.
 * @returns The count if successful.
 * @throws The error from the query if one occurred.
 */
export async function safeCountQuery(
  queryPromise: PromiseLike<{ data: unknown; count: number | null; error: PostgrestError | null }>
): Promise<number> {
  try {
    const { count, error } = await queryPromise;

    if (error) {
      // AbortError is expected under query cancellation.
      if (isAbortError(error)) {
        return 0;
      }
      logSupabaseError(error);
      throw error;
    }

    return count ?? 0;
  } catch (err) {
    if (isAbortError(err)) {
      return 0; // Return 0 on abort for count queries
    }
    
    if (isPostgrestError(err)) {
      logSupabaseError(err);
    } else {
      console.error("Unexpected error during Supabase count query:", err);
    }
    throw err;
  }
}
