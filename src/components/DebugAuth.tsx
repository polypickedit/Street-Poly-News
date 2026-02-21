import { useCallback, useEffect, useState } from 'react';
import { useIsFetching, useIsMutating, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Minus, Plus } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { safeFetch } from '@/lib/safeFetch';

// Extend Database type to include get_user_roles RPC if missing
interface DebugDatabase extends Database {
  public: Database['public'] & {
    Functions: Database['public']['Functions'] & {
      get_user_roles: {
        Args: Record<string, never>;
        Returns: { role: string }[];
      };
    };
  };
}

const db = supabase as unknown as SupabaseClient<DebugDatabase>;

type AppSnapshot = {
  path: string;
  search: string;
  hash: string;
  online: boolean;
  visibility: DocumentVisibilityState;
  focused: boolean;
  isFetching: number;
  isMutating: number;
  activeQueries: string[];
  timestamp: string;
  userAgent: string;
};

export function DebugAuth() {
  const auth = useAuth();
  const canViewDebugger =
    auth.status === 'authenticated' &&
    !!auth.user &&
    auth.rolesLoaded &&
    auth.isAdmin;
  const [sessionCheck, setSessionCheck] = useState<{ hasSession: boolean; user?: string; error: unknown } | null>(null);
  const [rolesCheck, setRolesCheck] = useState<{ data: unknown; error: unknown } | null>(null);
  const [profileCheck, setProfileCheck] = useState<{ data: unknown; error: unknown } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'auth' | 'app'>('auth');
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('debug-auth-minimized');
    return saved ? JSON.parse(saved) : false;
  });
  const [visibility, setVisibility] = useState<DocumentVisibilityState>(document.visibilityState);
  const [focused, setFocused] = useState<boolean>(document.hasFocus());
  const [appSnapshot, setAppSnapshot] = useState<AppSnapshot | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const queryClient = useQueryClient();

  const captureAppSnapshot = useCallback(() => {
    const activeQueries = queryClient
      .getQueryCache()
      .findAll()
      .filter((q) => q.state.fetchStatus === 'fetching')
      .map((q) => JSON.stringify(q.queryKey));

    setAppSnapshot({
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      online: navigator.onLine,
      visibility: document.visibilityState,
      focused: document.hasFocus(),
      isFetching,
      isMutating,
      activeQueries,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  }, [isFetching, isMutating, queryClient]);

  useEffect(() => {
    const onVisibilityChange = () => setVisibility(document.visibilityState);
    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    captureAppSnapshot();
  }, [captureAppSnapshot, auth.status, auth.rolesLoaded, auth.traceId]);

  useEffect(() => {
    localStorage.setItem('debug-auth-minimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      console.log('--- START DIAGNOSTICS ---');

      console.log('1. Fetching session...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Session Result:', { sessionData, sessionError });
      setSessionCheck({ hasSession: !!sessionData.session, user: sessionData.session?.user?.id, error: sessionError });

      // 2. Check Roles
      console.log('2. Fetching roles RPC...');
      const rolesData = await safeFetch(db.rpc('get_user_roles'));
      console.log('Roles RPC Result:', { rolesData });
      setRolesCheck({ data: rolesData, error: null }); // safeFetch swallows/logs error, or we catch below

      // 3. Check Profile
      console.log('3. Fetching profile...');
      const profileData = await safeFetch(
        db
        .from('profiles')
        .select('*')
        .eq('id', sessionData.session?.user?.id)
        .maybeSingle()
      );
      console.log('Profile Result:', { profileData });
      setProfileCheck({ data: profileData, error: null });

      console.log('--- END DIAGNOSTICS ---');
    } catch (err) {
      console.error('Diagnostics failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyJson = useCallback(async (label: string, value: unknown) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
      setCopyStatus(`Copied ${label}`);
      setTimeout(() => setCopyStatus(null), 1500);
    } catch (error) {
      console.error('Copy failed:', error);
      setCopyStatus(`Copy failed: ${label}`);
      setTimeout(() => setCopyStatus(null), 2000);
    }
  }, []);

  const [isVisible, setIsVisible] = useState(() => {
    return localStorage.getItem('debug-auth-visible') === 'true';
  });

  useEffect(() => {
    const handleStorage = () => {
      setIsVisible(localStorage.getItem('debug-auth-visible') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!canViewDebugger || !isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm w-full opacity-90 hover:opacity-100 transition-opacity">
      <Card className="bg-black/95 text-white border-dem/50 shadow-2xl">
        <CardHeader className="py-2 px-4 border-b border-white/10">
          <CardTitle className="text-xs font-mono flex justify-between items-center text-dem">
            <span>Auth Debugger</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setIsMinimized((v) => !v)}
              aria-label={isMinimized ? 'Expand debugger' : 'Minimize debugger'}
            >
              {isMinimized ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            </Button>
          </CardTitle>
        </CardHeader>
        {!isMinimized && (
          <CardContent className="p-4 text-[10px] font-mono space-y-3 max-h-[420px] overflow-y-auto">
          {copyStatus && (
            <div className="rounded border border-green-500/30 bg-green-500/10 px-2 py-1 text-[10px] text-green-300">
              {copyStatus}
            </div>
          )}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'auth' | 'app')}>
            <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
              <TabsTrigger value="auth" className="text-[10px] data-[state=active]:bg-dem/25">Auth</TabsTrigger>
              <TabsTrigger value="app" className="text-[10px] data-[state=active]:bg-cyan-500/25">App</TabsTrigger>
            </TabsList>

            <TabsContent value="auth" className="mt-3 space-y-3">
              <div className="space-y-1">
                <div className="font-bold text-dem/80 uppercase tracking-wider">Context State</div>
                <div className="bg-white/5 p-2 rounded border border-white/5">
                  <div className="grid grid-cols-[80px_1fr] gap-1">
                    <span className="text-white/50">Status:</span>
                    <span className={auth.status === 'authenticated' ? 'text-green-400' : 'text-yellow-400'}>{auth.status}</span>

                    <span className="text-white/50">Roles Loaded:</span>
                    <span className={auth.rolesLoaded ? 'text-green-400' : 'text-red-400'}>{String(auth.rolesLoaded)}</span>

                    <span className="text-white/50">User ID:</span>
                    <span className="truncate opacity-70">{auth.user?.id || 'null'}</span>

                    <span className="text-white/50">Is Admin:</span>
                    <span className={auth.isAdmin ? 'text-green-400' : 'text-white/50'}>{String(auth.isAdmin)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] bg-dem/20 border-dem/40 hover:bg-dem/40 text-white"
                  onClick={runDiagnostics}
                  disabled={loading}
                >
                  {loading ? 'Running...' : 'Run Diagnostics'}
                </Button>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] bg-white/10 border-white/20 hover:bg-white/20 text-white"
                  onClick={() =>
                    copyJson('auth bundle', {
                      context: {
                        status: auth.status,
                        rolesLoaded: auth.rolesLoaded,
                        userId: auth.user?.id ?? null,
                        isAdmin: auth.isAdmin,
                        isEditor: auth.isEditor,
                        traceId: auth.traceId,
                        error: auth.error ?? null,
                      },
                      sessionCheck,
                      rolesCheck,
                    })
                  }
                >
                  Copy Auth Bundle
                </Button>
              </div>

              {sessionCheck && (
                <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-blue-400 uppercase tracking-wider">1. Session Check</div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/40 text-white"
                      onClick={() => copyJson('session check', sessionCheck)}
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-blue-500/10 p-2 rounded border border-blue-500/20 overflow-x-auto">
                    {JSON.stringify(sessionCheck, null, 2)}
                  </pre>
                </div>
              )}

              {rolesCheck && (
                <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-purple-400 uppercase tracking-wider">2. Roles RPC Check</div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/40 text-white"
                      onClick={() => copyJson('roles rpc check', rolesCheck)}
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-purple-500/10 p-2 rounded border border-purple-500/20 overflow-x-auto">
                    {JSON.stringify(rolesCheck, null, 2)}
                  </pre>
                </div>
              )}

              {profileCheck && (
                <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-orange-400 uppercase tracking-wider">3. Profile Check</div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] bg-orange-500/20 border-orange-500/30 hover:bg-orange-500/40 text-white"
                      onClick={() => copyJson('profile check', profileCheck)}
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-orange-500/10 p-2 rounded border border-orange-500/20 overflow-x-auto">
                    {JSON.stringify(profileCheck, null, 2)}
                  </pre>
                </div>
              )}
            </TabsContent>

            <TabsContent value="app" className="mt-3 space-y-3">
              <div className="space-y-1">
                <div className="font-bold text-cyan-400 uppercase tracking-wider">Runtime State</div>
                <div className="bg-white/5 p-2 rounded border border-white/5">
                  <div className="grid grid-cols-[90px_1fr] gap-1">
                    <span className="text-white/50">Path:</span>
                    <span className="truncate">{window.location.pathname || '/'}</span>

                    <span className="text-white/50">Online:</span>
                    <span className={navigator.onLine ? 'text-green-400' : 'text-red-400'}>{String(navigator.onLine)}</span>

                    <span className="text-white/50">Visible:</span>
                    <span className={visibility === 'visible' ? 'text-green-400' : 'text-yellow-400'}>{visibility}</span>

                    <span className="text-white/50">Focused:</span>
                    <span className={focused ? 'text-green-400' : 'text-yellow-400'}>{String(focused)}</span>

                    <span className="text-white/50">Fetching:</span>
                    <span className={isFetching > 0 ? 'text-yellow-400' : 'text-white/60'}>{isFetching}</span>

                    <span className="text-white/50">Mutating:</span>
                    <span className={isMutating > 0 ? 'text-yellow-400' : 'text-white/60'}>{isMutating}</span>

                    <span className="text-white/50">Active Qs:</span>
                    <span className={appSnapshot?.activeQueries?.length ? 'text-yellow-400' : 'text-white/60'}>
                      {appSnapshot?.activeQueries?.length ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] bg-cyan-500/20 border-cyan-500/40 hover:bg-cyan-500/40 text-white"
                  onClick={captureAppSnapshot}
                >
                  Snapshot
                </Button>
              </div>

              {appSnapshot && (
                <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-cyan-300 uppercase tracking-wider">App Snapshot</div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] bg-cyan-500/20 border-cyan-500/30 hover:bg-cyan-500/40 text-white"
                      onClick={() => copyJson('app snapshot', appSnapshot)}
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-cyan-500/10 p-2 rounded border border-cyan-500/20 overflow-x-auto">
                    {JSON.stringify(appSnapshot, null, 2)}
                  </pre>
                </div>
              )}
            </TabsContent>
          </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
