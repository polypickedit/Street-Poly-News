import { supabase } from '@/integrations/supabase/client';
import { safeQuery } from '@/lib/supabase-debug';
import { generateTraceId } from '@/utils/trace';

type RoleCheckResult = boolean | null;

export type RoleHydrationResult =
  | { ok: true; isAdmin: boolean; isEditor: boolean; traceId: string }
  | { ok: false; error: Error; traceId: string };

interface HydrateOptions {
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
}

export async function hydrateRoles(userId: string, { timeoutMs = 10000, retries = 2, signal }: HydrateOptions = {}): Promise<RoleHydrationResult> {
  const traceId = generateTraceId();
  let attempt = 0;

  while (attempt <= retries) {
    attempt++;
    const controller = new AbortController();
    const combinedSignal = controller.signal;

    const onAbort = () => controller.abort();
    if (signal) {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener('abort', onAbort, { once: true });
      }
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // RPC: get_user_roles()
      // Expected to return a list of roles, e.g. ["admin", "editor"] or [{ role: "admin" }]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userRoles, error: rpcError } = await (supabase as any)
        .rpc('get_user_roles')
        .abortSignal(combinedSignal);

      if (rpcError) {
        throw rpcError;
      }

      if (userRoles) {
        // Normalize the result to handle different potential return shapes
        // Case 1: Array of strings ["admin", "editor"]
        // Case 2: Array of objects [{ role: "admin" }, { name: "editor" }]
        // Case 3: Array of objects with function name key [{ get_user_roles: "admin" }]
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const roles = Array.isArray(userRoles) ? userRoles.map((r: any) => {
          if (typeof r === 'string') return r;
          if (typeof r === 'object' && r !== null) {
            // Return the first string value found in the object
            return Object.values(r).find(v => typeof v === 'string') as string || '';
          }
          return '';
        }) : [];

        const isAdmin = roles.includes('admin');
        const isEditor = roles.includes('editor') || isAdmin;
        
        return { ok: true, isAdmin, isEditor, traceId };
      }
      
      // If we got here with no error but no roles, return false for both (or check table fallback if we really wanted to, but we don't)
      return { ok: true, isAdmin: false, isEditor: false, traceId };

    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      
      if (signal?.aborted) {
        return { ok: false, error: new Error('Aborted'), traceId };
      }

      // Check if it's a network/abort error to decide on retry
      const reason = error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errAny = reason as any;
      const isNetworkError = errAny?.name === 'AbortError' || errAny?.message?.includes('abort') || errAny?.message?.includes('Failed to fetch');

      // If we have retries left and it's a network error (or we want to retry everything?), wait and continue
      // The user wants robustness. Retrying generic errors might be okay if transient.
      if (attempt <= retries) {
        console.warn(`Auth: Role hydration attempt ${attempt} failed, retrying...`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        continue;
      }

      const err = error instanceof Error ? error : new Error('Unknown role hydration error');
      // If we failed after retries (or non-retryable), return error
      return { ok: false, error: err, traceId };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onAbort);
    }
  }

  return { ok: false, error: new Error('Role hydration failed after retries'), traceId };
}
