
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { AuthContext } from './AuthContextInternal';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);

  const checkRoles = useCallback(async (userId: string) => {
    try {
      console.log("Auth: Checking roles for", userId);
      
      // Use a Promise.race to ensure role check doesn't hang indefinitely
      const rolePromise = (async () => {
        // Check if user has admin or editor role using the RPC function
        const { data: hasAccess, error: rpcError } = await supabase.rpc("is_admin_or_editor");

        if (!rpcError && hasAccess !== null) {
          setIsAdmin(true);
          setIsEditor(true);
          return true;
        }

        // Fallback: Direct query to user_roles
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role_id, roles(name)")
          .eq("user_id", userId);

        if (!rolesError && roles) {
          const roleData = roles as unknown as Array<{ roles: { name: string } | null }>;
          const admin = roleData?.some(r => r.roles?.name === "admin");
          const editor = roleData?.some(r => r.roles?.name === "editor");
          setIsAdmin(admin);
          setIsEditor(editor);
          return true;
        }
        return false;
      })();

      // 3 second timeout for role checks
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Role check timeout")), 3000)
      );

      await Promise.race([rolePromise, timeoutPromise]);
      console.log("Auth: Role check completed");
    } catch (err) {
      console.error("Auth: Error checking roles:", err);
      // Don't let role check failure block the app, just default to non-admin
      setIsAdmin(false);
      setIsEditor(false);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      console.log("Auth: refreshAuth started");
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // We've got the session, so we can stop the main loading state
      setLoading(false);
      console.log("Auth: session resolved, loading set to false");
      
      if (currentSession?.user) {
        // Run role checks in the background without blocking 'loading'
        checkRoles(currentSession.user.id).catch(err => 
          console.error("Auth: Background role check error:", err)
        );
      } else {
        setIsAdmin(false);
        setIsEditor(false);
      }
    } catch (error) {
      console.error("Auth: Refresh error:", error);
      setLoading(false);
    }
  }, [checkRoles]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      console.log("Auth: Starting initAuth");
      try {
        // getSession is usually fast and reliable
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            // Start role check but don't await it here
            checkRoles(currentSession.user.id);
          }
        }
      } catch (err) {
        console.error("Auth: initAuth error:", err);
      } finally {
        if (mounted) {
          console.log("Auth: initAuth completed, setting loading false");
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      
      console.log("Auth: State change event:", event);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        // Check roles in the background
        checkRoles(currentSession.user.id);
      } else {
        setIsAdmin(false);
        setIsEditor(false);
      }

      // Any auth state change event means we've finished the initial check
      console.log("Auth: Resolving loading state from event", event);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshAuth, checkRoles]);

  // Safety valve: Ensure loading eventually resolves even if everything else fails
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Auth: Safety valve triggered, forcing loading to false");
        setLoading(false);
      }
    }, 3000); // 3 seconds is plenty for any auth check
    return () => clearTimeout(timer);
  }, [loading]);

  const value = {
    session,
    user,
    isAdmin,
    isEditor,
    loading,
    refreshAuth,
  };

  // Temporary debug logging for runtime verification
  useEffect(() => {
    console.log("Auth State Update:", {
      loading,
      hasSession: !!session,
      isAdmin,
      isEditor,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });
  }, [loading, session, isAdmin, isEditor, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
