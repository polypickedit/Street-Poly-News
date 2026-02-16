
import { PostgrestError } from '@supabase/supabase-js';

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
      logSupabaseError(error);
      throw error;
    }

    return data;
  } catch (err) {
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
