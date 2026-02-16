import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading, authReady } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Only log significant state changes
    if (authReady) {
      console.log("ProtectedRoute Check:", {
        authenticated: !!session,
        path: location.pathname
      });
    }
  }, [authReady, session, location.pathname]);

  // Wait for auth to be fully ready before making decisions
  if (!authReady || loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-white">
        <Loader2 className="h-8 w-8 animate-spin text-dem mb-4" />
        <p className="text-white/60 text-sm animate-pulse">Verifying access...</p>
      </div>
    );
  }

  if (!session) {
    console.log("ProtectedRoute: No session found, redirecting to login from", location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
