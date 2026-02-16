import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { GripHorizontal } from "lucide-react";

export const DevAuthOverlay = () => {
  const { status, loading, user, traceId, isAdmin, isEditor, rolesLoaded, error } = useAuth();
  const [position, setPosition] = useState({ x: window.innerWidth - 250, y: window.innerHeight - 200 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div 
      className="fixed z-[9999] w-[230px] rounded-2xl border border-white/30 bg-black/70 p-3 text-[11px] font-mono text-white backdrop-blur-xl shadow-2xl transition-shadow hover:shadow-white/10"
      style={{ 
        left: position.x, 
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <div 
        className="flex items-center justify-between mb-2 cursor-grab active:cursor-grabbing border-b border-white/10 pb-2"
        onMouseDown={handleMouseDown}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 select-none">Auth Debug</p>
        <GripHorizontal className="w-4 h-4 text-white/40" />
      </div>

      <div className="space-y-1 select-text">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/70">State</span>
          <span className={status === 'error' ? 'text-red-400' : 'text-green-400'}>{status}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/70">Loading</span>
          <span className={loading ? 'text-yellow-400 animate-pulse' : 'text-white/40'}>{loading ? "yes" : "no"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/70">User</span>
          <span className="truncate max-w-[90px]" title={user?.id}>{user?.id ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/70">Roles</span>
          <span className={isAdmin ? 'text-purple-400 font-bold' : ''}>{isAdmin ? "admin" : isEditor ? "editor" : "viewer"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/70">Roles Loaded</span>
          <span className={rolesLoaded ? 'text-green-400' : 'text-yellow-400'}>{rolesLoaded ? "yes" : "no"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/70">Trace</span>
          <span className="truncate max-w-[90px] text-white/30" title={traceId ?? ''}>{traceId ?? "idle"}</span>
        </div>
        {error && (
          <div className="mt-2 rounded bg-red-500/20 p-1.5 text-[10px] text-red-200 border border-red-500/30 break-all">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
