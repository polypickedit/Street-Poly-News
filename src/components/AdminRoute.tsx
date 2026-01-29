import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        // Check if user has admin or editor role in user_roles table
        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("roles(name)")
          .eq("user_id", session.user.id);

        if (error) {
          console.error("Error fetching roles:", error);
          setIsAuthorized(false);
        } else {
          const hasAccess = roles?.some(r => 
            r.roles && (r.roles as any).name === "admin" || (r.roles as any).name === "editor"
          );
          setIsAuthorized(!!hasAccess);
        }
      } catch (err) {
        console.error("Authorization check failed:", err);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthorized) {
    // If they are logged in but not authorized, redirect to home or a forbidden page
    // For now, redirecting to login if no session, or home if unauthorized session
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
