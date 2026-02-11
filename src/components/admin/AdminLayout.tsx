import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  ListMusic, 
  Library, 
  History, 
  Settings, 
  ChevronRight,
  ChevronLeft,
  LogOut,
  Inbox,
  Share2,
  Menu,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminStats, useAdminActivities } from "@/hooks/useAdminStats";
import { Zap } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { name: "Queue", path: "/admin/queue", icon: Inbox },
  { name: "Submissions", path: "/admin/submissions", icon: ListMusic },
  { name: "Outlets", path: "/admin/outlets", icon: Share2 },
  { name: "Placements", path: "/admin/placements", icon: History },
  { name: "Settings", path: "/admin/settings", icon: Settings },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdminMode, toggleAdminMode } = useAdmin();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Keep admin stats and activities alive at the layout level to prevent aborts during navigation
  useAdminStats(true);
  useAdminActivities(true);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className={cn(
        "border-r border-border bg-card flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn("p-6 flex items-center justify-between", isCollapsed && "px-4")}>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold tracking-tight text-dem">Streetpoly</h1>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-semibold">Media Portal</p>
              </div>
            )}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          <nav className={cn("flex-1 px-4 space-y-1", isCollapsed && "px-2")}>
            <Link
              to="/"
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-bold bg-dem text-white hover:bg-dem/90 rounded-lg transition-all shadow-lg shadow-dem/20 mb-4",
                isCollapsed && "justify-center px-0"
              )}
              title={isCollapsed ? "Back to Site" : undefined}
            >
              <Home className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Back to Site</span>}
            </Link>

            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg transition-colors group",
                    isActive 
                      ? "bg-dem/10 text-dem" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    isCollapsed ? "justify-center" : "justify-between"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-dem" : "text-muted-foreground group-hover:text-foreground")} />
                    {!isCollapsed && <span className="font-medium">{item.name}</span>}
                  </div>
                  {!isCollapsed && isActive && <ChevronRight className="w-4 h-4" />}
                </Link>
              );
            })}
          </nav>

          <div className={cn("p-4 border-t border-border space-y-4", isCollapsed && "p-2")}>
            <div className={cn("flex items-center gap-3 px-3 py-2", isCollapsed && "px-0 justify-center")}>
              <div className="w-8 h-8 rounded-full bg-dem flex items-center justify-center text-xs font-bold uppercase shrink-0 text-white">
                {user?.email?.substring(0, 2) || "AD"}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{user?.email?.split('@')[0] || "Admin User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || "admin@streetpolynews.com"}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              title={isCollapsed ? "Sign Out" : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-rep hover:bg-rep/10 rounded-lg transition-colors group",
                isCollapsed && "justify-center"
              )}
            >
              <LogOut className="w-5 h-5 group-hover:text-rep shrink-0 text-muted-foreground" />
              {!isCollapsed && <span className="font-medium">Sign Out</span>}
            </button>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-foreground">
            {navItems.find(i => i.path === location.pathname)?.name || "Admin"}
          </h2>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleAdminMode}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all font-bold text-xs uppercase tracking-widest",
                isAdminMode
                  ? "bg-dem text-white border-dem shadow-[0_0_15px_rgba(0,71,171,0.3)]"
                  : "bg-muted border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className={cn("w-3 h-3", isAdminMode && "fill-current animate-pulse")} />
              {isAdminMode ? "Conduction: ON" : "Enter Conduction Mode"}
            </button>
            <div className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider border border-border">
              Live Environment
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
