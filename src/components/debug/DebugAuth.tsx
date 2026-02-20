import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

export function DebugAuth() {
  const { session, user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [roles, setRoles] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  const runDiagnostics = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      // 1. Get Profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw new Error(`Profile Error: ${profileError.message}`);
      }
      setProfile(profileData as Record<string, unknown>);

      // 2. Get Roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);
      
      if (rolesError) {
        console.error("Roles fetch error:", rolesError);
        // Don't throw for roles, just log
      }
      setRoles((rolesData || []) as Record<string, unknown>[]);

      setLastCheck(new Date().toISOString());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 border-yellow-500 border-2 border-dashed bg-yellow-50/50 dark:bg-yellow-950/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-yellow-700 dark:text-yellow-500 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Auth Diagnostics
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runDiagnostics} 
            disabled={loading}
            className="border-yellow-200 hover:bg-yellow-100 dark:border-yellow-800 dark:hover:bg-yellow-900"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Run Check
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm font-mono">
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 border-b pb-1">Session Info</h3>
            <div>User ID: <span className="text-blue-600 dark:text-blue-400 break-all">{user.id}</span></div>
            <div>Email: <span className="text-blue-600 dark:text-blue-400">{user.email}</span></div>
            <div>Last Sign In: <span className="text-gray-500">{new Date(user.last_sign_in_at || "").toLocaleString()}</span></div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 border-b pb-1">Profile Data</h3>
            {profile ? (
              <div className="space-y-1">
                <div>Username: <span className="font-bold">{String(profile.username || "NULL")}</span></div>
                <div>Role: <span className="font-bold">{String(profile.role || "NULL")}</span></div>
                <div>Created: {String(profile.created_at || "Unknown")}</div>
              </div>
            ) : (
              <div className="text-gray-500 italic">Not loaded yet</div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-gray-700 dark:text-gray-300 border-b pb-1">User Roles ({roles.length})</h3>
          {roles.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {roles.map((r, i) => (
                <li key={i}>
                  <span className="font-semibold">{String(r.role || "unknown")}</span>
                  <span className="text-gray-500 text-xs ml-2">({String(r.id)})</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 italic">No roles found or not loaded</div>
          )}
        </div>

        <div className="pt-2 text-xs text-gray-400 border-t flex justify-between">
          <span>Auth Loading: {authLoading ? "Yes" : "No"}</span>
          <span>Last Check: {lastCheck ? new Date(lastCheck).toLocaleTimeString() : "Never"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
