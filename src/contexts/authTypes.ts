import type { Session, User } from '@supabase/supabase-js';

export type AuthStatus =
  | 'initializing'
  | 'unauthenticated'
  | 'authenticated'
  | 'error';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  rolesLoaded: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  error?: string;
  traceId?: string;
}

export const initialAuthState: AuthState = {
  status: 'initializing',
  user: null,
  session: null,
  rolesLoaded: false,
  isAdmin: false,
  isEditor: false,
  error: undefined,
  traceId: undefined,
};
