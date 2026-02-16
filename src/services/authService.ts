import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { generateTraceId } from '@/utils/trace';

type SessionResponse = Awaited<ReturnType<typeof supabase.auth.getSession>>;

export type AuthServiceResult =
  | { ok: true; response: SessionResponse; traceId: string }
  | { ok: false; error: Error; traceId: string };

interface FetchSessionOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function fetchSession({ timeoutMs = 4000, signal }: FetchSessionOptions = {}): Promise<AuthServiceResult> {
  const traceId = generateTraceId();
  const controller = new AbortController();
  const combinedSignal = controller.signal;

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  let timeoutId: ReturnType<typeof setTimeout>;

  try {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const response = await supabase.auth.getSession({ signal: combinedSignal });
    return { ok: true, response, traceId };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown session fetch error');
    return { ok: false, error: err, traceId };
  } finally {
    clearTimeout(timeoutId);
  }
}
