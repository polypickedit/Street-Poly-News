import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export function ArtistProfileGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  const { profile, isLoading } = useProfile();

  const isCompletionRoute = location.pathname === "/complete-profile";
  const isLoginRoute = location.pathname === "/login";

  if (status === "initializing") {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-white">
        <Loader2 className="h-8 w-8 animate-spin text-dem mb-4" />
        <p className="text-white/60 text-sm animate-pulse">Loading identity...</p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-white">
        <Loader2 className="h-8 w-8 animate-spin text-dem mb-4" />
        <p className="text-white/60 text-sm animate-pulse">Checking profile...</p>
      </div>
    );
  }

  if (profile?.profile_type === "artist" && !profile.display_name && !isCompletionRoute && !isLoginRoute) {
    return <Navigate to="/complete-profile" replace />;
  }

  if (isCompletionRoute && profile && profile.profile_type !== "artist") {
    return <Navigate to="/" replace />;
  }

  if (isCompletionRoute && profile?.profile_type === "artist" && profile.display_name) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
