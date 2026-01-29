import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Library, Users, Music } from "lucide-react";

export const PlaylistManager = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Editorial Assets</h3>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" />
          Add Playlist
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all overflow-hidden group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                  <Library className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-tighter">Active</span>
                  <Switch checked={true} />
                </div>
              </div>
              <CardTitle className="mt-4 text-lg font-bold">Midnight Tech House</CardTitle>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] bg-slate-800 border-slate-700">HOUSE</Badge>
                <Badge variant="outline" className="text-[10px] bg-slate-800 border-slate-700">ENERGETIC</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 mt-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Users className="w-3 h-3" />
                    <span className="text-[10px] uppercase font-bold tracking-tight">Followers</span>
                  </div>
                  <p className="text-sm font-semibold">12.4k</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Music className="w-3 h-3" />
                    <span className="text-[10px] uppercase font-bold tracking-tight">Cap/Max</span>
                  </div>
                  <p className="text-sm font-semibold">42 / 100</p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button variant="secondary" className="flex-1 text-xs bg-slate-800 hover:bg-slate-700">Edit Details</Button>
                <Button variant="ghost" className="text-xs text-blue-400 hover:text-blue-300">View on Spotify</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
