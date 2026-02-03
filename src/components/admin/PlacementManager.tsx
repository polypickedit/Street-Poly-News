import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Calendar, ExternalLink, RefreshCw } from "lucide-react";

export const PlacementManager = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="active" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-card border border-white/10">
            <TabsTrigger value="active" className="data-[state=active]:bg-dem data-[state=active]:text-white">Active</TabsTrigger>
            <TabsTrigger value="ending" className="data-[state=active]:bg-dem data-[state=active]:text-white">Ending Soon</TabsTrigger>
            <TabsTrigger value="historical" className="data-[state=active]:bg-dem data-[state=active]:text-white">Historical</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2">
            <RefreshCw className="w-3 h-3" />
            Refresh Status
          </Button>
        </div>

        <TabsContent value="active" className="m-0">
          <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/40">Track</TableHead>
                  <TableHead className="text-white/40">Playlist</TableHead>
                  <TableHead className="text-white/40">Duration</TableHead>
                  <TableHead className="text-white/40">Time Left</TableHead>
                  <TableHead className="text-right text-white/40">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i} className="border-white/10 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="font-medium text-white">Cyberpunk Sunset</div>
                      <div className="text-xs text-white/40 italic">Electronic • Future Pop</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-dem/10 text-dem border-dem/20">
                          NEON NIGHTS
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-white/40">
                        <Calendar className="w-3 h-3" />
                        Oct 01 - Oct 31
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-white">14 Days</span>
                        <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-dem w-[60%]" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-dem hover:text-dem/80 hover:bg-dem/10">
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="ending" className="m-0">
          {/* Ending content placeholder */}
          <div className="p-12 text-center border border-dashed border-white/10 rounded-xl bg-card">
            <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-white/40">No placements ending in the next 7 days</h4>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
