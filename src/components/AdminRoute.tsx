import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Loader2 } from "lucide-react";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, status, rolesLoaded, isAdmin, isEditor } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("%cROUTE TRANSITION", "color: #a78bfa; font-weight: bold;", "admin.check", {
        status,
        rolesLoaded,
        hasSession: !!session,
        isAdmin,
        isEditor,
        pathname: location.pathname,
      });
    }
  }, [isAdmin, isEditor, location.pathname, rolesLoaded, session, status]);

  if (status === "initializing") {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-dem" />
      </div>
    );
  }

  if (status !== "authenticated" || !session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!rolesLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-dem" />
        <p className="text-white/60 text-sm animate-pulse">Verifying admin access...</p>
      </div>
    );
  }

  if (!isAdmin && !isEditor) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
