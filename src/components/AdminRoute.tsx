import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Loader2 } from "lucide-react";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading, isAdmin, isEditor } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      console.log("AdminRoute Gate:", {
        hasSession: !!session,
        isAdmin,
        isEditor,
        pathname: location.pathname
      });
    }
  }, [loading, session, isAdmin, isEditor, location]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-dem" />
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in but not an admin or editor, redirect to home
  if (!isAdmin && !isEditor) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
