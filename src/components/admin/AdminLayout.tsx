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
import { useAdmin } from "@/providers/AdminProvider";
import { Zap } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { name: "Queue", path: "/admin/queue", icon: Inbox },
  { name: "Submissions", path: "/admin/submissions", icon: ListMusic },
  { name: "Playlists", path: "/admin/playlists", icon: Library },
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside className={cn(
        "border-r border-slate-800 bg-slate-900/50 flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn("p-6 flex items-center justify-between", isCollapsed && "px-4")}>
          {!isCollapsed && (
            <div>
                <h1 className="text-xl font-bold tracking-tight text-dem">Streetpoly</h1>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Media Portal</p>
              </div>
            )}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium bg-dem text-white hover:bg-dem/90 rounded-lg transition-all shadow-lg shadow-dem/20",
              isCollapsed && "justify-center px-0"
            )}
            title={isCollapsed ? "Back to Home" : undefined}
          >
            <Home className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-bold">Back to Home</span>}
          </Link>
          </div>

          <nav className={cn("flex-1 px-4 space-y-1", isCollapsed && "px-2")}>
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
                      : "text-slate-300 hover:text-white hover:bg-slate-800",
                    isCollapsed ? "justify-center" : "justify-between"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-dem" : "text-slate-400 group-hover:text-slate-200")} />
                    {!isCollapsed && <span className="font-medium">{item.name}</span>}
                  </div>
                  {!isCollapsed && isActive && <ChevronRight className="w-4 h-4" />}
                </Link>
              );
            })}
          </nav>

          <div className={cn("p-4 border-t border-slate-800 space-y-4", isCollapsed && "p-2")}>
            <div className={cn("flex items-center gap-3 px-3 py-2", isCollapsed && "px-0 justify-center")}>
              <div className="w-8 h-8 rounded-full bg-dem flex items-center justify-center text-xs font-bold uppercase shrink-0">
                {user?.email?.substring(0, 2) || "AD"}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-white">{user?.email?.split('@')[0] || "Admin User"}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || "admin@streetpolynews.com"}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              title={isCollapsed ? "Sign Out" : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-rep hover:bg-rep/10 rounded-lg transition-colors group",
                isCollapsed && "justify-center"
              )}
            >
              <LogOut className="w-5 h-5 group-hover:text-rep shrink-0 text-slate-400" />
              {!isCollapsed && <span className="font-medium">Sign Out</span>}
            </button>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold">
            {navItems.find(i => i.path === location.pathname)?.name || "Admin"}
          </h2>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleAdminMode}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all font-bold text-xs uppercase tracking-widest",
                isAdminMode
                  ? "bg-dem text-white border-dem shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              )}
            >
              <Zap className={cn("w-3 h-3", isAdminMode && "fill-current animate-pulse")} />
              {isAdminMode ? "Conduction: ON" : "Enter Conduction Mode"}
            </button>
            <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider border border-slate-700">
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
