import React from "react";
import { AlertTriangle, FileText, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FatalError() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-4 font-sans selection:bg-red-500/30">
      <div className="max-w-2xl w-full space-y-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Environment Configuration Missing
          </h1>
          <p className="text-zinc-400 text-lg">
            The application cannot start because required environment variables are not defined.
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-200">System Diagnostics</span>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">VITE_SUPABASE_URL</span>
                <span className="font-mono text-red-400">Missing</span>
              </div>
              <div className="h-px bg-zinc-800" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">VITE_SUPABASE_ANON_KEY</span>
                <span className="font-mono text-red-400">Missing</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">How to Fix</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-zinc-200 font-medium">
                <FileText className="w-4 h-4 text-blue-400" />
                Step 1: Create .env.local
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Copy the example configuration file to create your local environment file.
              </p>
              <div className="bg-black/50 p-2 rounded border border-zinc-800 font-mono text-xs text-zinc-300">
                cp .env.example .env.local
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-zinc-200 font-medium">
                <Terminal className="w-4 h-4 text-green-400" />
                Step 2: Restart Server
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                After creating the file, restart your development server to load the changes.
              </p>
              <div className="bg-black/50 p-2 rounded border border-zinc-800 font-mono text-xs text-zinc-300">
                npm run dev
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300"
          >
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
}
