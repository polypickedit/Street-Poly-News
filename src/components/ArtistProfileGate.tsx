import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export function ArtistProfileGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  const { profile, isLoading, error } = useProfile();
  const [profileGateTimedOut, setProfileGateTimedOut] = useState(false);

  const isCompletionRoute = location.pathname === "/complete-profile";
  const isLoginRoute = location.pathname === "/login";

  useEffect(() => {
    if (status !== "authenticated" || !isLoading) {
      setProfileGateTimedOut(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      console.warn("ArtistProfileGate: profile loading timeout, failing open.");
      setProfileGateTimedOut(true);
    }, 8000);

    return () => window.clearTimeout(timeout);
  }, [isLoading, status]);

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

  if (isLoading && !profileGateTimedOut) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-white">
        <Loader2 className="h-8 w-8 animate-spin text-dem mb-4" />
        <p className="text-white/60 text-sm animate-pulse">Checking profile...</p>
      </div>
    );
  }

  // Do not block page rendering forever on profile fetch failures.
  if (error || profileGateTimedOut) {
    return <>{children}</>;
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
