import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, status } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log("%cROUTE TRANSITION", "color: #a78bfa; font-weight: bold;", "protected.check", {
      status,
      authenticated: !!session,
      path: location.pathname,
    });
  }, [location.pathname, session, status]);

  if (status === "initializing") {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-white">
        <Loader2 className="h-8 w-8 animate-spin text-dem mb-4" />
        <p className="text-white/60 text-sm animate-pulse">Verifying access...</p>
      </div>
    );
  }

  if (status !== "authenticated" || !session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
