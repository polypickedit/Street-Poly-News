import { createContext } from 'react';
import { Session, User } from '@supabase/supabase-js';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isEditor: boolean;
  loading: boolean;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  isEditor: false,
  loading: true,
  refreshAuth: async () => {},
});
