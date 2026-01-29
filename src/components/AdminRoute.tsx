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
        console.log("AdminRoute: Checking authorization...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("AdminRoute: Session error:", sessionError);
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        if (!session) {
          console.log("AdminRoute: No session found");
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        console.log("AdminRoute: Session found for user:", session.user.email);

        // Check if user has admin or editor role using the RPC function
        // @ts-expect-error - RPC is not in the generated types
        const { data: hasAccess, error: rpcError } = await supabase.rpc("is_admin_or_editor");

        if (rpcError) {
          console.warn("AdminRoute: RPC check failed, falling back to direct query:", rpcError);
          
          // Fallback: Direct query to user_roles
          // @ts-expect-error - user_roles and roles are not in the generated types yet
          const { data: roles, error: rolesError } = await supabase
            .from("user_roles")
            .select("role_id, roles(name)")
            .eq("user_id", session.user.id);

          if (rolesError) {
            console.error("AdminRoute: Direct query check failed:", rolesError);
            setIsAuthorized(false);
          } else {
            const roleData = roles as unknown as Array<{ roles: { name: string } }>;
            const hasDirectAccess = roleData?.some(r => 
              r.roles?.name === "admin" || r.roles?.name === "editor"
            );
            console.log("AdminRoute: Direct access check result:", hasDirectAccess);
            setIsAuthorized(!!hasDirectAccess);
          }
        } else {
          console.log("AdminRoute: RPC access check result:", hasAccess);
          setIsAuthorized(!!hasAccess);
        }
      } catch (err) {
        console.error("AdminRoute: Authorization check failed with exception:", err);
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
