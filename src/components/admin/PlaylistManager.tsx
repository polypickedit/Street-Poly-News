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
        <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider">Editorial Assets</h3>
        <Button className="bg-dem hover:bg-dem/90 text-white gap-2">
          <Plus className="w-4 h-4" />
          Add Playlist
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card border-white/10 hover:border-white/20 transition-all overflow-hidden group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded bg-dem/20 flex items-center justify-center group-hover:bg-dem/30 transition-colors">
                  <Library className="w-6 h-6 text-dem" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 font-medium uppercase tracking-tighter">Active</span>
                  <Switch checked={true} />
                </div>
              </div>
              <CardTitle className="mt-4 text-lg font-bold text-white">Midnight Tech House</CardTitle>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-white/60">HOUSE</Badge>
                <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-white/60">ENERGETIC</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white/40">
                    <Users className="w-3 h-3" />
                    <span className="text-[10px] uppercase font-bold tracking-tight">Followers</span>
                  </div>
                  <p className="text-sm font-semibold text-white">12.4k</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white/40">
                    <Music className="w-3 h-3" />
                    <span className="text-[10px] uppercase font-bold tracking-tight">Cap/Max</span>
                  </div>
                  <p className="text-sm font-semibold text-white">42 / 100</p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button variant="secondary" className="flex-1 text-xs bg-white/5 border-white/10 text-white hover:bg-white/10">Edit Details</Button>
                <Button variant="ghost" className="text-xs text-dem hover:text-dem/80 hover:bg-dem/10">View on Spotify</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
