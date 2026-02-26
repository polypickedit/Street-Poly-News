import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Chrome, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { validateUsername } from "@/lib/username";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Normalize redirect path to prevent open redirects
  const redirectPath = useMemo(() => {
    const rawRedirect = searchParams.get("redirectTo");
    if (!rawRedirect) return "/";
    
    // If it's a full URL, only allow if it matches our origin
    if (rawRedirect.startsWith("http")) {
      try {
        const url = new URL(rawRedirect);
        if (url.origin === window.location.origin) {
          return url.pathname + url.search + url.hash;
        }
      } catch {
        return "/";
      }
      return "/";
    }
    
    // If it's a relative path, ensure it starts with / and doesn't use // (protocol relative)
    if (rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")) {
      return rawRedirect;
    }
    
    return "/";
  }, [searchParams]);

  const googleAuthEnabled = import.meta.env.VITE_AUTH_GOOGLE_ENABLED !== "false";
  const projectRef =
    import.meta.env.VITE_SUPABASE_URL?.split(".")[0]?.split("//")[1] || "unknown";
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [profileType, setProfileType] = useState<"artist" | "viewer">("viewer");
  const [displayName, setDisplayName] = useState("");
  const [usernameAvailability, setUsernameAvailability] = useState<{
    status: "idle" | "checking" | "available" | "taken" | "invalid" | "error";
    message: string | null;
  }>({ status: "idle", message: null });
  const { session, status: authStatus } = useAuth();
  const showDebug = searchParams.get("debug") === "true";
  const isAuthCallbackFlow =
    searchParams.has("code") ||
    searchParams.has("access_token") ||
    searchParams.has("refresh_token") ||
    searchParams.has("type");
  const emailConfirmationRedirectUrl = `${window.location.origin}${redirectPath}`;
  const loginRedirectUrl = `${window.location.origin}/login?redirectTo=${encodeURIComponent(redirectPath)}`;
  const resetPasswordRedirectUrl = `${window.location.origin}/login?redirectTo=${encodeURIComponent(redirectPath)}&type=recovery`;

  useEffect(() => {
    if (authStatus === "authenticated" && session) {
      console.log("Login: Session ready, redirecting to", redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [authStatus, session, navigate, redirectPath]);

  useEffect(() => {
    if (!isSignUp) {
      setUsernameAvailability({ status: "idle", message: null });
      return;
    }

    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameAvailability({ status: "idle", message: null });
      return;
    }

    const validation = validateUsername(trimmed);
    if (!validation.valid) {
      setUsernameAvailability({
        status: "invalid",
        message: validation.message ?? "Invalid username.",
      });
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setUsernameAvailability({ status: "checking", message: "Checking username..." });

      const { data, error } = await supabase.rpc("check_username_availability", {
        p_username: trimmed,
      });

      if (cancelled) return;

      if (error) {
        setUsernameAvailability({
          status: "error",
          message: "Could not verify username. Please try again.",
        });
        return;
      }

      if (data?.[0]?.available) {
        setUsernameAvailability({ status: "available", message: "Username available" });
        return;
      }

      setUsernameAvailability({
        status: "taken",
        message: "Username already taken. Try another.",
      });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [isSignUp, username]);

  const signUpBlocked = useMemo(() => {
    if (!isSignUp) return false;

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) return true;

    if (usernameAvailability.status !== "available") return true;

    if (profileType === "artist" && !displayName.trim()) return true;

    return false;
  }, [displayName, isSignUp, profileType, username, usernameAvailability.status]);


  const mapAuthError = (error: { message: string }) => {
    console.error("Auth Error Detail:", error);
    const message = error.message.toLowerCase();
    if (message.includes("invalid login credentials")) {
      return "Email or password didn't match. Please try again.";
    }
    if (message.includes("user already registered")) {
      return "That email already has an account. Try signing in instead.";
    }
    if (message.includes("email not confirmed")) {
      return "Check your inbox to confirm your email before signing in.";
    }
    if (message.includes("password is too short")) {
      return "Password must be at least 6 characters long.";
    }
    if (message.includes("unsupported provider")) {
      return `Google sign-in is disabled on Supabase project ${projectRef}. Enable Google in Authentication -> Providers, or use email/password.`;
    }
    if (message.includes("service unavailable") || message.includes("fetch failed")) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }
    return error.message;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      
      if (isSignUp) {
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
          throw new Error(usernameValidation.message ?? "Invalid username.");
        }

        if (usernameAvailability.status !== "available") {
          throw new Error("Username already taken. Try another.");
        }

        if (profileType === "artist" && !displayName.trim()) {
          throw new Error("Artist display name is required.");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              username: username.trim(),
              profile_type: profileType,
              display_name: displayName.trim() || null,
              full_name: displayName.trim() || null,
            },
            emailRedirectTo: emailConfirmationRedirectUrl,
          },
        });
        
        if (error) throw error;
        
        toast({
          title: "Verify your email",
          description: "We've sent a confirmation link to your inbox.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Welcome back",
          description: "Signed in successfully.",
        });
        // On successful sign-in, the useEffect will redirect.
      }
    } catch (error: unknown) {
      const authError = error as { message: string };
      toast({
        title: isSignUp ? "Sign up failed" : "Sign in failed",
        description: mapAuthError(authError),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleAuthEnabled) {
      toast({
        title: "Google sign-in unavailable",
        description: `This environment is configured with VITE_AUTH_GOOGLE_ENABLED=false for project ${projectRef}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: loginRedirectUrl,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      const authError = error as { message: string };
      toast({
        title: "Google Login failed",
        description: mapAuthError(authError),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetPasswordRedirectUrl,
      });
      if (error) throw error;
      toast({
        title: "Reset link sent",
        description: "Check your email for the password reset link.",
      });
    } catch (error: unknown) {
      const err = error as { message: string };
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authStatus === "initializing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-dem" />
        <div className="text-center">
          <p className="text-white/40 animate-pulse text-sm">Verifying access...</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-xs text-dem hover:text-dem/80 underline transition-colors"
          >
            Taking too long? Refresh
          </button>
        </div>
      </div>
    );
  }

  if (isAuthCallbackFlow && authStatus !== "authenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-dem" />
        <div className="text-center">
          <p className="text-white/40 animate-pulse text-sm">Completing sign-in...</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-xs text-dem hover:text-dem/80 underline transition-colors"
          >
            Taking too long? Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-dem/30 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-rep/20 rounded-full blur-[120px]" />
      </div>

      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-display text-white tracking-tight">
            {isSignUp ? "Join StreetPoly" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-white/40">
            {isSignUp 
              ? "Create your account to get started" 
              : "Sign in to manage your submissions"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {showDebug && (
            <div className="p-3 mb-4 rounded bg-black/40 border border-yellow-500/30 text-[10px] font-mono text-yellow-500/80 overflow-hidden">
              <div className="grid grid-cols-[80px_1fr] gap-1">
                <span className="opacity-50">Origin:</span> <span className="truncate">{window.location.origin}</span>
                <span className="opacity-50">Redirect:</span> <span className="truncate">{POST_AUTH_REDIRECT_PATH}</span>
                <span className="opacity-50">Status:</span> <span>{authStatus}</span>
                <span className="opacity-50">Session:</span> <span>{session ? "✅" : "❌"}</span>
                <span className="opacity-50">Storage:</span> <span>{Object.keys(localStorage).some(k => k.startsWith('sb-')) ? "✅" : "❌"}</span>
              </div>
            </div>
          )}
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/60 text-xs font-semibold uppercase tracking-wider">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white h-11 focus:border-dem transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-white/60 text-xs font-semibold uppercase tracking-wider">Password</Label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-[10px] text-dem hover:text-dem/80 font-medium uppercase tracking-tighter"
                >
                  Forgot Password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white h-11 focus:border-dem transition-all"
              />
            </div>

            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white/60 text-xs font-semibold uppercase tracking-wider">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="your.name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white h-11 focus:border-dem transition-all"
                  />
                  {usernameAvailability.message && (
                    <p
                      className={`text-xs ${
                        usernameAvailability.status === "available"
                          ? "text-green-400"
                          : usernameAvailability.status === "checking"
                            ? "text-white/50"
                            : "text-red-400"
                      }`}
                    >
                      {usernameAvailability.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Profile Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProfileType("viewer")}
                      className={`h-11 rounded-md border text-sm font-semibold transition-colors ${
                        profileType === "viewer"
                          ? "border-dem bg-dem/20 text-white"
                          : "border-white/10 bg-white/5 text-white/70"
                      }`}
                    >
                      Viewer
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileType("artist")}
                      className={`h-11 rounded-md border text-sm font-semibold transition-colors ${
                        profileType === "artist"
                          ? "border-dem bg-dem/20 text-white"
                          : "border-white/10 bg-white/5 text-white/70"
                      }`}
                    >
                      Artist
                    </button>
                  </div>
                </div>

                {profileType === "artist" && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                      Artist Display Name
                    </Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Your artist name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white h-11 focus:border-dem transition-all"
                    />
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              className="w-full bg-dem hover:bg-dem/90 text-white h-11 font-bold transition-all duration-200 group"
              disabled={loading || signUpBlocked}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Sign Up" : "Sign In"}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {googleAuthEnabled && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0A0A0A] px-2 text-white/40 font-medium">Or continue with</span>
                </div>
              </div>

              <Button
                variant="outline"
                type="button"
                onClick={handleGoogleLogin}
                className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white h-11 font-medium transition-all"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Chrome className="mr-2 h-4 w-4" />
                    Google
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
