import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      console.log("ProtectedRoute Gate:", {
        hasSession: !!session,
        pathname: location.pathname
      });
    }
  }, [loading, session, location]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-400 animate-pulse">Verifying access...</p>
          <div className="mt-8">
            <p className="text-xs text-slate-600 mb-2">Taking longer than usual?</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-xs text-blue-500 hover:text-blue-400 underline transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};