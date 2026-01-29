
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session) {
          console.log("Session found, redirecting to admin...");
          navigate("/admin");
        }
      })
      .catch(err => {
        console.error("Error getting session:", err);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      if (session) {
        navigate("/admin");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      console.log("Login: Attempting sign in for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Login: Sign in error:", error.message);
        throw error;
      }
      
      console.log("Login: Sign in successful for:", data.user?.email);
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      console.log("Login: Navigating to /admin");
      navigate("/admin");
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error signing in",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      if (!supabase.auth) {
        throw new Error("Supabase auth is not initialized. Check your environment variables.");
      }

      // Detect if we're on localhost or production
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      // Use the correct redirect URL based on environment
      // Supabase requires the exact URL to be added to the Redirect URLs list in the Auth settings
      const redirectTo = isLocal 
        ? `${window.location.origin}/admin`
        : `https://streetpolynews.com/admin`;

      console.log("Login: Initiating Google OAuth with redirect to:", redirectTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error signing in",
        description: message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-dem-dark border-blue-900/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-display text-blue-50">Welcome Back</CardTitle>
          <CardDescription className="text-blue-200/50">
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-200/70">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-900 border-blue-900/50 text-white placeholder:text-blue-200/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-blue-200/70">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-900 border-blue-900/50 text-white"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-rep hover:bg-rep/90 text-white font-display tracking-widest uppercase"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-blue-900/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-dem-dark px-2 text-blue-200/30">Or continue with</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full border-blue-900/50 text-blue-100 hover:bg-blue-900/20"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
            )}
            Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
