import { useAuth } from "@/hooks/useAuth";

export default function Diagnostics() {
  const { session } = useAuth();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const canonicalHost = import.meta.env.VITE_CANONICAL_HOST;
  const mode = import.meta.env.MODE;

  return (
    <div className="p-8 bg-black text-white min-h-screen font-mono text-sm">
      <h1 className="text-xl font-bold mb-4 text-dem">Production Diagnostics</h1>
      
      <div className="space-y-4 border border-white/20 p-4 rounded">
        <div>
          <h2 className="text-white/50 uppercase tracking-wider text-xs">Environment Variables</h2>
          <div className="mt-2 grid grid-cols-[200px_1fr] gap-2">
            <span className="text-blue-400">VITE_SUPABASE_URL</span>
            <span className={!supabaseUrl ? "text-red-500" : "text-green-400"}>
              {supabaseUrl || "UNDEFINED"}
            </span>

            <span className="text-blue-400">VITE_CANONICAL_HOST</span>
            <span>{canonicalHost || "undefined"}</span>

            <span className="text-blue-400">MODE</span>
            <span>{mode}</span>
          </div>
        </div>

        <div>
          <h2 className="text-white/50 uppercase tracking-wider text-xs">Auth State</h2>
          <div className="mt-2 grid grid-cols-[200px_1fr] gap-2">
            <span className="text-blue-400">Has Session</span>
            <span>{session ? "YES" : "NO"}</span>
            
            <span className="text-blue-400">User ID</span>
            <span>{session?.user?.id || "N/A"}</span>
          </div>
        </div>

        <div>
          <h2 className="text-white/50 uppercase tracking-wider text-xs">Browser Info</h2>
          <div className="mt-2 grid grid-cols-[200px_1fr] gap-2">
            <span className="text-blue-400">Origin</span>
            <span>{window.location.origin}</span>
            
            <span className="text-blue-400">User Agent</span>
            <span className="break-all">{navigator.userAgent}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
