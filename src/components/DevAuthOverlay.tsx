import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { GripHorizontal, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const DevAuthOverlay = () => {
  const { status, loading, user, traceId, isAdmin, isEditor, rolesLoaded, error } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const saved = localStorage.getItem('dev-auth-overlay-pos');
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 250, y: window.innerHeight - 200 };
  });
  
  const [isDragging, setIsDragging] = useState(false);
  
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('dev-auth-overlay-min');
    return saved ? JSON.parse(saved) : false;
  });
  
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    localStorage.setItem('dev-auth-overlay-pos', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    localStorage.setItem('dev-auth-overlay-min', JSON.stringify(isMinimized));
  }, [isMinimized]);

  // Re-check bounds when minimized state changes (dimensions change)
  useEffect(() => {
    const width = overlayRef.current?.offsetWidth || 230;
    const height = overlayRef.current?.offsetHeight || 40;
    
    setPosition(prev => ({
      x: Math.max(0, Math.min(prev.x, window.innerWidth - width)),
      y: Math.max(0, Math.min(prev.y, window.innerHeight - height))
    }));
  }, [isMinimized]);

  useEffect(() => {
    const handleResize = () => {
      const width = overlayRef.current?.offsetWidth || 230;
      const height = overlayRef.current?.offsetHeight || 100;
      
      setPosition(prev => ({
        x: Math.min(Math.max(0, prev.x), window.innerWidth - width),
        y: Math.min(Math.max(0, prev.y), window.innerHeight - height)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.style.left = `${position.x}px`;
      overlayRef.current.style.top = `${position.y}px`;
    }
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && overlayRef.current) {
        const newX = e.clientX - dragStart.current.x;
        const newY = e.clientY - dragStart.current.y;
        
        const width = overlayRef.current.offsetWidth || 230;
        const height = overlayRef.current.offsetHeight || 40;

        const x = Math.max(0, Math.min(newX, window.innerWidth - width));
        const y = Math.max(0, Math.min(newY, window.innerHeight - height));
        
        overlayRef.current.style.left = `${x}px`;
        overlayRef.current.style.top = `${y}px`;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (overlayRef.current) {
        const rect = overlayRef.current.getBoundingClientRect();
        setPosition({ x: rect.left, y: rect.top });
      }
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
      ref={overlayRef}
      className={cn(
        "fixed z-[9999] w-[230px] rounded-2xl border border-white/30 bg-black/70 p-3 text-[11px] font-mono text-white backdrop-blur-xl shadow-2xl transition-all duration-200 hover:shadow-white/10",
        isDragging ? "cursor-grabbing" : "cursor-default"
      )}
    >
      <div 
        className={cn(
          "flex items-center justify-between cursor-grab active:cursor-grabbing",
          !isMinimized && "mb-2 border-b border-white/10 pb-2"
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-white/40" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 select-none">Auth Debug</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(!isMinimized);
          }}
          className="text-white/40 hover:text-white transition-colors p-0.5 rounded-sm hover:bg-white/10"
        >
          {isMinimized ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        </button>
      </div>

      {!isMinimized && (
        <div className="space-y-1 select-text animate-in fade-in slide-in-from-top-1 duration-200">
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
      )}
    </div>
  );
};
