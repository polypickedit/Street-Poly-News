import { createContext } from 'react';
import type { AuthState } from './authTypes';

export interface AuthContextType extends AuthState {
  loading: boolean;
  authReady: boolean;
  appReady: boolean;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  status: 'initializing',
  user: null,
  session: null,
  rolesLoaded: false,
  isAdmin: false,
  isEditor: false,
  error: undefined,
  traceId: null,
  loading: true,
  authReady: false,
  appReady: false,
  refreshAuth: async () => {},
});
